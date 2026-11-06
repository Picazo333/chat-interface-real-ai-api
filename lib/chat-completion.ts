import { tokensPerSecond } from "./metrics";
import {
  GROQ_CHAT_COMPLETIONS_URL,
  type ChatMode,
  type PublicTurn,
  type TurnMetrics,
  type TurnSource,
  type Usage,
} from "./types";

export type CompletionSuccess = {
  ok: true;
  source: TurnSource;
  model: string;
  message: { role: "assistant"; content: string };
  usage: Usage;
  metrics: TurnMetrics;
};

export type CompletionFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

export type CompletionResult = CompletionSuccess | CompletionFailure;

export type CompletionInput = {
  messages: PublicTurn[];
  model: string;
  apiKey?: string;
  mode: ChatMode;
  scenario?: "error" | "success";
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  now?: () => number;
  latencyMs?: number;
};

export function resolveEffectiveMode(mode: ChatMode, apiKey: string | undefined): TurnSource {
  if (mode === "mock") return "mock";
  if (mode === "live") return "groq";
  return apiKey && apiKey.trim() ? "groq" : "mock";
}

export function estimateMockTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

export function buildMockReply(messages: PublicTurn[]): string {
  const userTurns = messages.filter((message) => message.role === "user").length;
  const last = messages[messages.length - 1]?.content ?? "";
  const excerpt = last.replace(/\s+/g, " ").slice(0, 80);
  return (
    `Respuesta de demostración, sin modelo. ` +
    `Turnos de usuario en el historial enviado: ${userTurns}. ` +
    `Último mensaje: “${excerpt}”.`
  );
}

export function mockLatencyMs(completionTokens: number): number {
  return Math.min(800, 120 + completionTokens);
}

function mockUsage(messages: PublicTurn[], reply: string): Usage {
  const promptTokens = messages.reduce(
    (total, message) => total + estimateMockTokens(message.content),
    0,
  );
  const completionTokens = estimateMockTokens(reply);
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
}

function redact(text: string, secret: string | undefined): string {
  if (!secret) return text;
  return text.split(secret).join("[redacted]");
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function readableStatusMessage(status: number, providerMessage: string | null): string {
  if (status === 401 || status === 403) {
    return "Groq rechazó la clave del servidor. Revisa GROQ_API_KEY y vuelve a intentarlo.";
  }
  if (status === 404) {
    return "Groq no reconoce el modelo configurado. Revisa GROQ_MODEL.";
  }
  if (status === 413) {
    return "Groq rechazó el tamaño de la petición. Acorta el historial e inténtalo de nuevo.";
  }
  if (status === 429) {
    return "Groq limitó la petición. Espera un momento y pulsa Reintentar.";
  }
  if (status >= 500) {
    return "Groq no pudo completar la respuesta. Pulsa Reintentar.";
  }
  if (providerMessage) {
    return `Groq respondió ${status}: ${providerMessage.slice(0, 180)}`;
  }
  return `Groq respondió con un error ${status}. Pulsa Reintentar.`;
}

async function readProviderMessage(response: Response, secret: string | undefined): Promise<string | null> {
  try {
    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== "object") return null;
    const record = payload as Record<string, unknown>;
    const error = record.error;
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) {
        return redact(message.trim(), secret);
      }
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return redact(record.message.trim(), secret);
    }
    return null;
  } catch {
    return null;
  }
}

function parseGroqPayload(
  payload: unknown,
  responseTimeMs: number,
): CompletionSuccess | CompletionFailure {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      status: 502,
      code: "invalid_payload",
      message: "La respuesta de Groq no tiene el formato esperado.",
    };
  }
  const record = payload as Record<string, unknown>;
  const choices = record.choices;
  const first = Array.isArray(choices) ? choices[0] : undefined;
  const message =
    first && typeof first === "object"
      ? (first as Record<string, unknown>).message
      : undefined;
  const content =
    message && typeof message === "object"
      ? (message as Record<string, unknown>).content
      : undefined;
  if (typeof content !== "string" || !content.trim()) {
    return {
      ok: false,
      status: 502,
      code: "empty_completion",
      message: "Groq no devolvió texto en esta respuesta.",
    };
  }

  const usageRecord =
    record.usage && typeof record.usage === "object"
      ? (record.usage as Record<string, unknown>)
      : null;
  const promptTokens = readFiniteNumber(usageRecord?.prompt_tokens);
  const completionTokens = readFiniteNumber(usageRecord?.completion_tokens);
  const totalTokens = readFiniteNumber(usageRecord?.total_tokens);
  if (promptTokens === null || completionTokens === null || totalTokens === null) {
    return {
      ok: false,
      status: 502,
      code: "missing_usage",
      message: "Groq no incluyó el objeto usage con los tres conteos de tokens.",
    };
  }

  const model = typeof record.model === "string" && record.model.trim() ? record.model : "";
  if (!model) {
    return {
      ok: false,
      status: 502,
      code: "missing_model",
      message: "Groq no indicó el modelo en la respuesta.",
    };
  }

  const providerCompletionTimeSec = readFiniteNumber(usageRecord?.completion_time);
  const usage: Usage = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  };

  return {
    ok: true,
    source: "groq",
    model,
    message: { role: "assistant", content },
    usage,
    metrics: {
      responseTimeMs,
      tokensPerSecond: tokensPerSecond(
        completionTokens,
        responseTimeMs,
        providerCompletionTimeSec,
      ),
      providerCompletionTimeSec,
    },
  };
}

async function waitForLatency(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, Math.min(ms, 5000));
    const onAbort = () => {
      clearTimeout(timer);
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function mockResult(messages: PublicTurn[], model: string): CompletionSuccess {
  const content = buildMockReply(messages);
  const usage = mockUsage(messages, content);
  const responseTimeMs = mockLatencyMs(usage.completion_tokens);
  return {
    ok: true,
    source: "mock",
    model,
    message: { role: "assistant", content },
    usage,
    metrics: {
      responseTimeMs,
      tokensPerSecond: tokensPerSecond(usage.completion_tokens, responseTimeMs, null),
      providerCompletionTimeSec: null,
    },
  };
}

export async function completeChat(input: CompletionInput): Promise<CompletionResult> {
  const model = input.model.trim();
  if (!model) {
    return {
      ok: false,
      status: 500,
      code: "missing_model_config",
      message: "Falta el modelo en la configuración del servidor (GROQ_MODEL).",
    };
  }

  const effective = resolveEffectiveMode(input.mode, input.apiKey);
  if (effective === "mock") {
    try {
      await waitForLatency(input.latencyMs ?? 0, input.signal);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          status: 499,
          code: "aborted",
          message: "La petición se canceló antes de completarse.",
        };
      }
      throw error;
    }
    if (input.scenario === "error") {
      return {
        ok: false,
        status: 502,
        code: "mock_error",
        message:
          "Error de demostración: la petición simulada fue rechazada. El mensaje sigue en el historial.",
      };
    }
    return mockResult(input.messages, model);
  }

  const apiKey = input.apiKey?.trim();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: "missing_key",
      message:
        "Falta GROQ_API_KEY en el servidor. La clave no se lee en el navegador. Configúrala y reinicia, o usa CHAT_MODE=mock.",
    };
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? Date.now;
  const started = now();
  let response: Response;
  try {
    response = await fetchImpl(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      cache: "no-store",
      signal: input.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 499,
        code: "aborted",
        message: "La petición se canceló antes de completarse.",
      };
    }
    return {
      ok: false,
      status: 502,
      code: "network",
      message: "No se pudo contactar con Groq. Revisa la red del servidor e inténtalo de nuevo.",
    };
  }

  const responseTimeMs = Math.max(0, now() - started);
  if (!response.ok) {
    const providerMessage = await readProviderMessage(response, apiKey);
    return {
      ok: false,
      status: response.status,
      code: "groq_error",
      message: redact(readableStatusMessage(response.status, providerMessage), apiKey),
    };
  }

  try {
    const payload = (await response.json()) as unknown;
    return parseGroqPayload(payload, responseTimeMs);
  } catch {
    return {
      ok: false,
      status: 502,
      code: "invalid_json",
      message: "La respuesta de Groq no es JSON válido.",
    };
  }
}
