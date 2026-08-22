import { NextResponse } from "next/server";
import { Modality } from "@google/genai";

import { requireUser } from "@/lib/firebase-admin";
import { geminiClient, LIVE_MODEL } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const ai = geminiClient();
    if (!ai) return NextResponse.json({ error: "Voice is unavailable. Please type your request below." }, { status: 503 });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: { responseModalities: [Modality.AUDIO] },
        },
      },
    });
    return NextResponse.json({ token: token.name, model: LIVE_MODEL });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Voice could not start." }, { status: 401 });
  }
}
