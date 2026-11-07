import {
  SESSION_STORAGE_KEY,
  type ChatMessage,
  type Role,
  type SessionSnapshot,
  type TurnSource,
} from "./types";
import { isUsage } from "./metrics";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LoadResult =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "ok"; session: SessionSnapshot };

const ROLES: Role[] = ["user", "assistant"];
const SOURCES: TurnSource[] = ["mock", "groq"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

function isSource(value: unknown): value is TurnSource {
  return typeof value === "string" && SOURCES.includes(value as TurnSource);
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0) return false;
  if (!isRole(record.role)) return false;
  if (typeof record.content !== "string") return false;
  if (typeof record.createdAt !== "string") return false;
  if (record.usage !== undefined && !isUsage(record.usage)) return false;
  if (record.model !== undefined && typeof record.model !== "string") return false;
  if (record.source !== undefined && !isSource(record.source)) return false;
  if (record.metrics !== undefined) {
    if (!record.metrics || typeof record.metrics !== "object") return false;
    const metrics = record.metrics as Record<string, unknown>;
    if (typeof metrics.responseTimeMs !== "number" || !Number.isFinite(metrics.responseTimeMs)) {
      return false;
    }
    if (typeof metrics.tokensPerSecond !== "number" || !Number.isFinite(metrics.tokensPerSecond)) {
      return false;
    }
    if (
      metrics.providerCompletionTimeSec !== null &&
      (typeof metrics.providerCompletionTimeSec !== "number" ||
        !Number.isFinite(metrics.providerCompletionTimeSec))
    ) {
      return false;
    }
  }
  return true;
}

export function loadSession(storage: Pick<Storage, "getItem">): LoadResult {
  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (raw === null || raw === "") return { status: "empty" };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { status: "invalid" };
    const record = parsed as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.messages)) return { status: "invalid" };
    if (!record.messages.every(isMessage)) return { status: "invalid" };
    return {
      status: "ok",
      session: { version: 1, messages: record.messages },
    };
  } catch {
    return { status: "invalid" };
  }
}

export function saveSession(storage: Pick<Storage, "setItem">, session: SessionSnapshot): void {
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(SESSION_STORAGE_KEY);
}
