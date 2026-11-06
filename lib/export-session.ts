import { accumulateUsage } from "./metrics";
import type { ChatMessage, Usage } from "./types";

export type ExportedTurn = {
  index: number;
  role: ChatMessage["role"];
  content: string;
  createdAt: string;
  source: ChatMessage["source"] | null;
  model: string | null;
  usage: Usage | null;
  responseTimeMs: number | null;
  tokensPerSecond: number | null;
};

export type SessionExport = {
  exportedAt: string;
  disclaimer: string;
  totals: Usage;
  turns: ExportedTurn[];
};

const DISCLAIMER =
  "Exportación local del historial guardado en este navegador. " +
  "Los turnos con source \"mock\" son demostración: sus tokens no salen de Groq. " +
  "Los turnos con source \"groq\" conservan el usage recibido en esa respuesta.";

export function buildSessionExport(messages: ChatMessage[], exportedAt: string): SessionExport {
  return {
    exportedAt,
    disclaimer: DISCLAIMER,
    totals: accumulateUsage(messages),
    turns: messages.map((message, index) => ({
      index: index + 1,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      source: message.source ?? null,
      model: message.model ?? null,
      usage: message.usage ?? null,
      responseTimeMs: message.metrics?.responseTimeMs ?? null,
      tokensPerSecond: message.metrics?.tokensPerSecond ?? null,
    })),
  };
}
