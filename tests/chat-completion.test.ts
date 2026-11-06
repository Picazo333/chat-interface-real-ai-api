import { afterEach, describe, expect, it, vi } from "vitest";
import { completeChat } from "../lib/chat-completion";
import { GROQ_CHAT_COMPLETIONS_URL } from "../lib/types";

const history = [
  { role: "user" as const, content: "Primer mensaje" },
  { role: "assistant" as const, content: "Primera respuesta" },
  { role: "user" as const, content: "Segundo mensaje" },
];

const apiKey = "gsk_test_secret_value";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("completeChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call Groq in mock mode and labels the usage as local", async () => {
    const fetchImpl = vi.fn();
    const result = await completeChat({
      messages: history,
      model: "qwen/qwen3.6-27b",
      mode: "mock",
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe("mock");
    expect(result.model).toBe("qwen/qwen3.6-27b");
    expect(result.usage.total_tokens).toBe(result.usage.prompt_tokens + result.usage.completion_tokens);
    expect(result.message.content).toMatch(/sin modelo/);
    expect(result.message.content).toMatch(/Turnos de usuario en el historial enviado: 2/);
  });

  it("stays on the mock path when auto has no key", async () => {
    const fetchImpl = vi.fn();
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      mode: "auto",
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.ok && result.source).toBe("mock");
  });

  it("refuses live mode without inventing a completion when the key is missing", async () => {
    const fetchImpl = vi.fn();
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      mode: "live",
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, status: 503, code: "missing_key" });
  });

  it("posts the full history to Groq with bearer and json headers", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        model: "qwen/qwen3.6-27b",
        choices: [{ message: { role: "assistant", content: "Respuesta del fixture." } }],
        usage: {
          prompt_tokens: 18,
          completion_tokens: 8,
          total_tokens: 26,
          completion_time: 0.4,
        },
      }),
    );

    const result = await completeChat({
      messages: history,
      model: "qwen/qwen3.6-27b",
      apiKey,
      mode: "live",
      fetchImpl,
      now: (() => {
        let tick = 1000;
        return () => (tick += 250);
      })(),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(GROQ_CHAT_COMPLETIONS_URL);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${apiKey}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      model: "qwen/qwen3.6-27b",
      messages: history,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe("groq");
    expect(result.usage).toEqual({
      prompt_tokens: 18,
      completion_tokens: 8,
      total_tokens: 26,
    });
    expect(result.metrics.tokensPerSecond).toBe(20);
    expect(result.metrics.providerCompletionTimeSec).toBe(0.4);
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it("turns a non-2xx Groq response into a readable message without the key", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(401, { error: { message: `bad ${apiKey}` } }),
    );
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      apiKey,
      mode: "live",
      fetchImpl,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
    expect(result.message).toMatch(/clave/);
    expect(result.message).not.toContain(apiKey);
  });

  it("does not invent usage when Groq omits it", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        model: "qwen/qwen3.6-27b",
        choices: [{ message: { content: "Texto sin usage" } }],
      }),
    );
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      apiKey,
      mode: "live",
      fetchImpl,
    });
    expect(result).toMatchObject({ ok: false, code: "missing_usage" });
  });

  it("ignores the mock error scenario when the call is live", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        model: "qwen/qwen3.6-27b",
        choices: [{ message: { content: "Real fixture" } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3, completion_time: 0.5 },
      }),
    );
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      apiKey,
      mode: "live",
      scenario: "error",
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.ok && result.source).toBe("groq");
  });

  it("returns the demonstration error without calling Groq", async () => {
    const fetchImpl = vi.fn();
    const result = await completeChat({
      messages: [{ role: "user", content: "Hola" }],
      model: "qwen/qwen3.6-27b",
      mode: "mock",
      scenario: "error",
      fetchImpl,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, code: "mock_error" });
  });
});
