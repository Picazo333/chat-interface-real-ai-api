export const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";

/** Id nombrado en el brief del enunciado. Configurable con GROQ_MODEL. */
export const ASSIGNMENT_MODEL_ID = "qwen/qwen3.6-27b";

export const SESSION_STORAGE_KEY = "groq-chat-session-v1";

export const MOTION_STORAGE_KEY = "signal-motion";

export const MAX_MESSAGE_CHARS = 4000;

export const MAX_HISTORY_MESSAGES = 40;

export type Role = "user" | "assistant";

export type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type TurnSource = "mock" | "groq";

export type TurnMetrics = {
  responseTimeMs: number;
  tokensPerSecond: number;
  providerCompletionTimeSec: number | null;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  usage?: Usage;
  metrics?: TurnMetrics;
  model?: string;
  source?: TurnSource;
};

export type PublicTurn = {
  role: Role;
  content: string;
};

export type SessionSnapshot = {
  version: 1;
  messages: ChatMessage[];
};

export type ChatMode = "auto" | "mock" | "live";

export const EMPTY_USAGE: Usage = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};
