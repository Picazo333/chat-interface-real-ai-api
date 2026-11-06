import { NextResponse } from "next/server";
import { completeChat } from "@/lib/chat-completion";
import { readScenario, validatePublicTurns } from "@/lib/public-turns";
import { readServerChatConfig } from "@/lib/server-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = readServerChatConfig();
  return NextResponse.json({
    mode: config.effectiveMode,
    requestedMode: config.requestedMode,
    model: config.model,
    keyConfigured: config.keyConfigured,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_json",
        message: "El cuerpo de la petición no es JSON válido.",
      },
      { status: 400 },
    );
  }

  const validated = validatePublicTurns(body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid_history", message: validated.message },
      { status: 400 },
    );
  }

  const config = readServerChatConfig();
  const result = await completeChat({
    messages: validated.messages,
    model: config.model,
    apiKey: process.env.GROQ_API_KEY,
    mode: config.requestedMode,
    scenario: readScenario(body),
    signal: request.signal,
    latencyMs: config.mockLatencyMs,
  });

  if (!result.ok) {
    const status = result.status === 499 ? 499 : result.status;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  return NextResponse.json(result);
}
