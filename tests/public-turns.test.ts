import { describe, expect, it } from "vitest";
import { validatePublicTurns } from "../lib/public-turns";

describe("validatePublicTurns", () => {
  it("keeps role and content and drops anything else", () => {
    const result = validatePublicTurns({
      messages: [
        { role: "user", content: "  Hola  ", id: "no", usage: { prompt_tokens: 1 } },
        { role: "assistant", content: "Respuesta" },
        { role: "user", content: "Siguiente" },
      ],
    });

    expect(result).toEqual({
      ok: true,
      messages: [
        { role: "user", content: "Hola" },
        { role: "assistant", content: "Respuesta" },
        { role: "user", content: "Siguiente" },
      ],
    });
  });

  it("rejects a history that does not end with the user", () => {
    const result = validatePublicTurns({
      messages: [{ role: "assistant", content: "Solo" }],
    });
    expect(result.ok).toBe(false);
  });
});
