import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(path, "utf8");
}

describe("assignment constraints in source", () => {
  it("keeps the Groq call on fetch with explicit headers and no SDK", () => {
    const completion = source("lib/chat-completion.ts");
    const types = source("lib/types.ts");
    const pkg = source("package.json");
    expect(types).toContain("https://api.groq.com/openai/v1/chat/completions");
    expect(completion).toContain("GROQ_CHAT_COMPLETIONS_URL");
    expect(completion).toContain("Authorization: `Bearer ${apiKey}`");
    expect(completion).toContain('"Content-Type": "application/json"');
    expect(completion).toContain("await fetchImpl");
    expect(completion).not.toMatch(/from ["']groq["']/);
    expect(pkg).not.toMatch(/"groq"/);
  });

  it("reads the key only on the server and never via NEXT_PUBLIC_", () => {
    const route = source("app/api/chat/route.ts");
    const client = source("components/ChatSession.tsx");
    expect(route).toContain("process.env.GROQ_API_KEY");
    expect(route).not.toContain("NEXT_PUBLIC_");
    expect(client).not.toContain("GROQ_API_KEY");
    expect(client).not.toContain("NEXT_PUBLIC_");
    expect(client).toContain("useState");
    expect(client).toContain("useEffect");
    expect(client).toContain("localStorage");
  });
});
