import { EMPTY_USAGE, type ChatMessage, type Usage } from "./types";

export function isUsage(value: unknown): value is Usage {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return ["prompt_tokens", "completion_tokens", "total_tokens"].every((key) => {
    const number = record[key];
    return typeof number === "number" && Number.isFinite(number) && number >= 0;
  });
}

export function usageMismatch(usage: Usage): boolean {
  return usage.prompt_tokens + usage.completion_tokens !== usage.total_tokens;
}

export function accumulateUsage(messages: Pick<ChatMessage, "usage">[]): Usage {
  return messages.reduce<Usage>((totals, message) => {
    if (!message.usage) return totals;
    return {
      prompt_tokens: totals.prompt_tokens + message.usage.prompt_tokens,
      completion_tokens: totals.completion_tokens + message.usage.completion_tokens,
      total_tokens: totals.total_tokens + message.usage.total_tokens,
    };
  }, { ...EMPTY_USAGE });
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function tokensPerSecond(
  completionTokens: number,
  responseTimeMs: number,
  providerCompletionTimeSec: number | null,
): number {
  const seconds =
    providerCompletionTimeSec !== null && providerCompletionTimeSec > 0
      ? providerCompletionTimeSec
      : responseTimeMs / 1000;
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return roundTo(completionTokens / seconds, 2);
}
