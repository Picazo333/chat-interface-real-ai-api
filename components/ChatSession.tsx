"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { buildSessionExport } from "@/lib/export-session";
import { accumulateUsage, isUsage, usageMismatch } from "@/lib/metrics";
import { createRequestGuard } from "@/lib/request-guard";
import { clearSession, loadSession, saveSession } from "@/lib/session-storage";
import type { ChatMessage, TurnMetrics, TurnSource, Usage } from "@/lib/types";

type ServerStatus = {
  mode: "mock" | "live";
  model: string;
  keyConfigured: boolean;
};

const tokenFormat = new Intl.NumberFormat("es");
const rateFormat = new Intl.NumberFormat("es", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatTokens(value: number): string {
  return tokenFormat.format(value);
}

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function BreakableId({ value }: { value: string }) {
  const parts = value.split("/");
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? "/" : null}
      {index > 0 ? <wbr /> : null}
      {part}
    </span>
  ));
}

function sourceLabel(source: TurnSource | undefined): string {
  if (source === "groq") return "Groq";
  if (source === "mock") return "Demostración";
  return "Sin origen";
}

export function ChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persist, setPersist] = useState(true);
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const guard = useRef(createRequestGuard());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const restoreClearFocus = useRef(false);

  useEffect(() => {
    try {
      const loaded = loadSession(window.localStorage);
      if (loaded.status === "ok") {
        setMessages(loaded.session.messages);
      } else if (loaded.status === "invalid") {
        setPersist(false);
        setStorageNote(
          "Había una sesión guardada, pero no se pudo leer. No se ha sobrescrito. Puedes borrarla.",
        );
      }
    } catch {
      setPersist(false);
      setStorageNote("Este navegador no dejó leer localStorage. La conversación no se guardará.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !persist) return;
    try {
      if (messages.length === 0) clearSession(window.localStorage);
      else saveSession(window.localStorage, { version: 1, messages });
    } catch {
      setStorageNote("No se pudo guardar la sesión en este navegador.");
    }
  }, [hydrated, persist, messages]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/chat", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("status");
        return (await response.json()) as ServerStatus;
      })
      .then((data) => {
        if (
          data &&
          (data.mode === "mock" || data.mode === "live") &&
          typeof data.model === "string"
        ) {
          setStatus(data);
          return;
        }
        setStatusError("La configuración del servidor no se pudo leer.");
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setStatusError("No se pudo comprobar si el servidor tiene clave de Groq.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (confirmClear) {
      confirmRef.current?.focus();
      const onKey = (event: globalThis.KeyboardEvent) => {
        if (event.key !== "Escape") return;
        restoreClearFocus.current = true;
        setConfirmClear(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (restoreClearFocus.current) {
      restoreClearFocus.current = false;
      clearRef.current?.focus();
    }
  }, [confirmClear]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, loading, error]);

  async function requestCompletion(history: ChatMessage[], scenario: "success" | "error") {
    const ticket = guard.current.start();
    setLoading(true);
    setError(null);
    setConfirmClear(false);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          scenario,
        }),
        signal: ticket.signal,
      });
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        if (!guard.current.isCurrent(ticket.id)) return;
        setError("La respuesta del servidor no se pudo leer.");
        return;
      }
      if (!guard.current.isCurrent(ticket.id)) return;
      const record =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
      if (!response.ok || !record || record.ok !== true) {
        const message =
          record && typeof record.message === "string"
            ? record.message
            : "La petición no se completó. Inténtalo de nuevo.";
        setError(message);
        return;
      }
      const content =
        record.message && typeof record.message === "object"
          ? (record.message as Record<string, unknown>).content
          : undefined;
      const metricsRecord =
        record.metrics && typeof record.metrics === "object"
          ? (record.metrics as Record<string, unknown>)
          : null;
      const source: TurnSource | null =
        record.source === "groq" || record.source === "mock" ? record.source : null;
      const model = typeof record.model === "string" ? record.model : "";
      if (
        !isUsage(record.usage) ||
        typeof content !== "string" ||
        !metricsRecord ||
        typeof metricsRecord.responseTimeMs !== "number" ||
        typeof metricsRecord.tokensPerSecond !== "number" ||
        !source ||
        !model
      ) {
        setError("La respuesta no trae texto, usage y métricas. No se han inventado cifras.");
        return;
      }
      const provider = metricsRecord.providerCompletionTimeSec;
      const metrics: TurnMetrics = {
        responseTimeMs: metricsRecord.responseTimeMs,
        tokensPerSecond: metricsRecord.tokensPerSecond,
        providerCompletionTimeSec: typeof provider === "number" ? provider : null,
      };
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        usage: record.usage,
        model,
        source,
        metrics,
      };
      setMessages((current) => [...current, assistant]);
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      if (!guard.current.isCurrent(ticket.id)) return;
      setError("No se pudo completar la petición. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      if (guard.current.isCurrent(ticket.id)) setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !hydrated) return;
    const text = input.trim();
    if (!text) {
      setError("Escribe un mensaje antes de enviarlo.");
      inputRef.current?.focus();
      return;
    }
    const history = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: text,
        createdAt: new Date().toISOString(),
      },
    ];
    setPersist(true);
    setMessages(history);
    setInput("");
    void requestCompletion(history, "success");
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function onRetry() {
    if (loading || messages.length === 0) return;
    void requestCompletion(messages, "success");
  }

  function onForceError() {
    if (loading || !hydrated || status?.mode !== "mock") return;
    const text = input.trim() || "Mensaje de prueba para el error simulado.";
    const history = [
      ...messages,
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: text,
        createdAt: new Date().toISOString(),
      },
    ];
    setPersist(true);
    setMessages(history);
    setInput("");
    void requestCompletion(history, "error");
  }

  function onConfirmClear() {
    guard.current.cancel();
    setPersist(true);
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
    setStorageNote(null);
    restoreClearFocus.current = true;
    setConfirmClear(false);
  }

  function onExport() {
    const document = buildSessionExport(messages, new Date().toISOString());
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "historial-chat.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const totals: Usage = accumulateUsage(messages);
  const replies = messages.filter((message) => message.role === "assistant" && message.usage);
  const latest = replies[replies.length - 1];
  const mismatched = replies.some((message) => message.usage && usageMismatch(message.usage));
  const sources = new Set(replies.map((message) => message.source));
  const describedBy = ["mensaje-ayuda", error ? "mensaje-error" : "", storageNote ? "storage-note" : ""]
    .filter(Boolean)
    .join(" ");
  const canRetry = Boolean(error) && messages[messages.length - 1]?.role === "user";

  return (
    <div className="workspace">
      <section id="conversacion" aria-labelledby="conversacion-titulo" className="panel">
        <h2 id="conversacion-titulo">Conversación</h2>
        <div className="banner" role="status">
          {!status && !statusError && "Comprobando si el servidor tiene clave de Groq…"}
          {statusError && statusError}
          {status?.mode === "mock" &&
            `Modo demostración. No hay llamada a Groq. Modelo configurado: ${status.model}. Los tokens de las respuestas nuevas se calculan en local y no son consumo real.`}
          {status?.mode === "live" &&
            `Modo Groq. El servidor enviará el historial con la clave configurada. Modelo: ${status.model}. Los tokens salen del objeto usage.`}
        </div>

        <div className="transcript" role="log" aria-live="polite" aria-relevant="additions" aria-label="Historial de la conversación">
          {!hydrated && <p role="status">Leyendo la sesión guardada en este navegador…</p>}
          {hydrated && messages.length === 0 && !loading && (
            <p className="empty">
              Todavía no hay mensajes. Escribe en el campo Mensaje y pulsa Enviar mensaje.
            </p>
          )}
          <ol className="message-list">
            {messages.map((message, index) => {
              const isNew = index === messages.length - 1;
              return (
                <li
                  key={message.id}
                  className={`message ${message.role === "user" ? "message-user" : "message-assistant"}${isNew ? " is-new" : ""}`}
                  data-motion-node={isNew ? "message" : undefined}
                >
                  <p className="message-label">
                    {message.role === "user" ? "Tú" : "Asistente"}
                    {message.source ? ` · ${sourceLabel(message.source)}` : ""}
                    <span className="message-time"> {formatClock(message.createdAt)}</span>
                  </p>
                  <p>{message.content}</p>
                </li>
              );
            })}
          </ol>
          {loading && (
            <p role="status" className="thinking">
              Pensando…
            </p>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <div id="mensaje-error" className="alert" role="alert">
            <p>{error}</p>
            {canRetry && (
              <button type="button" className="button" onClick={onRetry}>
                Reintentar la misma petición
              </button>
            )}
          </div>
        )}
        {storageNote && (
          <p id="storage-note" className="caption" role="status">
            {storageNote}
          </p>
        )}

        <form onSubmit={onSubmit}>
          <label htmlFor="mensaje">Mensaje</label>
          <textarea
            id="mensaje"
            name="mensaje"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            maxLength={4000}
            rows={4}
            disabled={!hydrated || loading}
            aria-describedby={describedBy}
          />
          <p id="mensaje-ayuda" className="caption">
            Enter envía. Mayús+Enter inserta una línea. Máximo 4000 caracteres.
          </p>
          <div className="actions">
            <button type="submit" className="button button-primary" disabled={!hydrated || loading || !input.trim()}>
              Enviar mensaje
            </button>
            {status?.mode === "mock" && (
              <button
                type="button"
                className="button"
                onClick={onForceError}
                disabled={!hydrated || loading}
              >
                Probar error de la API
              </button>
            )}
            {!confirmClear ? (
              <button
                type="button"
                className="button"
                ref={clearRef}
                onClick={() => setConfirmClear(true)}
                disabled={!hydrated}
              >
                Borrar conversación
              </button>
            ) : (
              <div className="confirm" role="group" aria-label="Confirmar borrado">
                <p>Se borrará el historial de este navegador.</p>
                <button type="button" className="button" ref={confirmRef} onClick={onConfirmClear}>
                  Confirmar borrado
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    restoreClearFocus.current = true;
                    setConfirmClear(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </form>
      </section>

      <aside id="uso" aria-labelledby="uso-titulo" className="panel">
        <h2 id="uso-titulo">Uso de la sesión</h2>
        <p className="caption">
          {replies.length === 0 && "Todavía no hay respuestas en esta sesión."}
          {replies.length > 0 && sources.has("mock") && !sources.has("groq") &&
            "Estas cifras son de demostración. No salen de Groq."}
          {sources.has("groq") && !sources.has("mock") &&
            "Cifras acumuladas del objeto usage de cada respuesta."}
          {sources.has("groq") && sources.has("mock") &&
            "La sesión mezcla respuestas de demostración y de Groq. Los totales suman lo guardado en cada turno."}
        </p>
        <dl className="totals">
          <div>
            <dt>Tokens de prompt</dt>
            <dd>{formatTokens(totals.prompt_tokens)}</dd>
          </div>
          <div>
            <dt>Tokens de completado</dt>
            <dd>{formatTokens(totals.completion_tokens)}</dd>
          </div>
          <div>
            <dt>Total de tokens</dt>
            <dd>{formatTokens(totals.total_tokens)}</dd>
          </div>
          <div>
            <dt>Modelo de la última respuesta</dt>
            <dd>{latest?.model ? <BreakableId value={latest.model} /> : "—"}</dd>
          </div>
          <div>
            <dt>Tiempo de la última petición</dt>
            <dd>{latest?.metrics ? `${formatTokens(Math.round(latest.metrics.responseTimeMs))} ms` : "—"}</dd>
          </div>
          <div>
            <dt>Tokens por segundo</dt>
            <dd>{latest?.metrics ? rateFormat.format(latest.metrics.tokensPerSecond) : "—"}</dd>
          </div>
        </dl>
        {latest?.source === "mock" && (
          <p className="caption">
            El modelo mostrado es el configurado en el servidor. El tiempo y los tokens por segundo de
            una respuesta de demostración son un cálculo local, no una medición de Groq.
          </p>
        )}
        {latest?.source === "groq" && latest.metrics?.providerCompletionTimeSec !== null && (
          <p className="caption">
            Los tokens por segundo usan usage.completion_time de Groq. El tiempo de la petición es el
            medido en el servidor.
          </p>
        )}
        {mismatched && (
          <p className="caption" role="status">
            En algún turno, usage.total_tokens no coincide con la suma de prompt y completado. Se
            muestran las cifras recibidas, sin corregirlas.
          </p>
        )}

        <div className="actions">
          <button type="button" className="button" onClick={onExport} disabled={messages.length === 0}>
            Exportar historial (.json)
          </button>
        </div>

        <h3>Desglose por respuesta</h3>
        {replies.length === 0 ? (
          <p className="caption">Sin respuestas todavía.</p>
        ) : (
          <ol className="turn-list">
            {replies.map((message, index) => (
              <li key={message.id}>
                <p className="turn-title">
                  Respuesta {index + 1} · {sourceLabel(message.source)}
                </p>
                <dl className="turn-fields">
                  <div>
                    <dt>Modelo</dt>
                    <dd>{message.model ? <BreakableId value={message.model} /> : "—"}</dd>
                  </div>
                  <div>
                    <dt>Prompt</dt>
                    <dd>{formatTokens(message.usage?.prompt_tokens ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Completado</dt>
                    <dd>{formatTokens(message.usage?.completion_tokens ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatTokens(message.usage?.total_tokens ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Tiempo</dt>
                    <dd>{message.metrics ? `${formatTokens(Math.round(message.metrics.responseTimeMs))} ms` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Tokens/s</dt>
                    <dd>{message.metrics ? rateFormat.format(message.metrics.tokensPerSecond) : "—"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
