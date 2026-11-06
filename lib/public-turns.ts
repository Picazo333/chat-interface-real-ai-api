import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, type PublicTurn, type Role } from "./types";

const ROLES = new Set<Role>(["user", "assistant"]);

export type TurnValidation =
  | { ok: true; messages: PublicTurn[] }
  | { ok: false; message: string };

export function validatePublicTurns(value: unknown): TurnValidation {
  if (!value || typeof value !== "object") {
    return { ok: false, message: "La petición no incluye un historial de mensajes." };
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.messages)) {
    return { ok: false, message: "El historial tiene que ser una lista de mensajes." };
  }
  if (record.messages.length === 0) {
    return { ok: false, message: "Escribe un mensaje antes de enviarlo." };
  }
  if (record.messages.length > MAX_HISTORY_MESSAGES) {
    return {
      ok: false,
      message: `El historial supera ${MAX_HISTORY_MESSAGES} mensajes. Borra la conversación para seguir.`,
    };
  }

  const messages: PublicTurn[] = [];
  for (const entry of record.messages) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, message: "Hay un mensaje del historial que no se puede leer." };
    }
    const turn = entry as Record<string, unknown>;
    if (typeof turn.role !== "string" || !ROLES.has(turn.role as Role)) {
      return { ok: false, message: "Cada mensaje tiene que ser de usuario o de asistente." };
    }
    if (typeof turn.content !== "string") {
      return { ok: false, message: "El texto de un mensaje no es válido." };
    }
    const content = turn.content.trim();
    if (!content) {
      return { ok: false, message: "Hay un mensaje vacío en el historial." };
    }
    if (content.length > MAX_MESSAGE_CHARS) {
      return {
        ok: false,
        message: `Cada mensaje admite como máximo ${MAX_MESSAGE_CHARS} caracteres.`,
      };
    }
    messages.push({ role: turn.role as Role, content });
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return { ok: false, message: "El último mensaje del historial tiene que ser del usuario." };
  }

  return { ok: true, messages };
}

export function readScenario(value: unknown): "error" | "success" {
  if (!value || typeof value !== "object") return "success";
  const scenario = (value as Record<string, unknown>).scenario;
  return scenario === "error" ? "error" : "success";
}
