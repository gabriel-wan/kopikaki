import { NextResponse } from "next/server";

import type { MatchIntent } from "@/lib/domain";
import { requireUser } from "@/lib/firebase-admin";
import { geminiClient, MATCH_MODEL } from "@/lib/gemini";
import { parseIntentFallback } from "@/lib/intent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = (await request.json()) as { transcript?: unknown };
    if (typeof body.transcript !== "string" || body.transcript.trim().length < 3) {
      return NextResponse.json({ error: "Please tell me what you feel like doing." }, { status: 400 });
    }

    const fallback = parseIntentFallback(body.transcript);
    const ai = geminiClient();
    if (!ai) return NextResponse.json({ intent: fallback, source: "local" });

    try {
      const response = await ai.models.generateContent({
        model: MATCH_MODEL,
        contents: `Understand this Singapore senior's social request. Keep Singlish meaning. Request: ${body.transcript}`,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              activity: { type: "string" },
              timeOfDay: { type: "string", enum: ["morning", "afternoon", "evening", "any"] },
              neighborhood: { type: "string" },
              language: { type: "string" },
              notes: { type: "string" },
            },
            required: ["activity", "timeOfDay", "neighborhood", "language"],
          },
        },
      });
      const intent = JSON.parse(response.text ?? "") as MatchIntent;
      return NextResponse.json({ intent, source: "gemini" });
    } catch {
      return NextResponse.json({ intent: fallback, source: "local" });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not understand the request." }, { status: 401 });
  }
}
