import { ASSIGNMENT_MODEL_ID, type ChatMode } from "./types";
import { resolveEffectiveMode } from "./chat-completion";

export type ServerChatConfig = {
  model: string;
  requestedMode: ChatMode;
  effectiveMode: "mock" | "live";
  keyConfigured: boolean;
  mockLatencyMs: number;
};

export function readChatMode(value: string | undefined): ChatMode {
  if (value === "mock" || value === "live" || value === "auto") return value;
  return "auto";
}

export function readServerChatConfig(env: NodeJS.ProcessEnv = process.env): ServerChatConfig {
  const model = env.GROQ_MODEL?.trim() || ASSIGNMENT_MODEL_ID;
  const requestedMode = readChatMode(env.CHAT_MODE?.trim());
  const keyConfigured = Boolean(env.GROQ_API_KEY?.trim());
  const parsedLatency = Number(env.MOCK_LATENCY_MS ?? "0");
  const mockLatencyMs =
    Number.isFinite(parsedLatency) && parsedLatency > 0 ? Math.min(parsedLatency, 5000) : 0;
  const effective = resolveEffectiveMode(
    requestedMode,
    keyConfigured ? env.GROQ_API_KEY : undefined,
  );

  return {
    model,
    requestedMode,
    effectiveMode: effective === "groq" ? "live" : "mock",
    keyConfigured,
    mockLatencyMs,
  };
}
