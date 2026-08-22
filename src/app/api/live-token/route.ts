import { NextResponse } from "next/server";
import { Modality } from "@google/genai";

import { routeError } from "@/lib/api-error";
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
        lockAdditionalFields: [],
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: { responseModalities: [Modality.AUDIO] },
        },
      },
    });
    return NextResponse.json({ token: token.name, model: LIVE_MODEL });
  } catch (error) {
    return routeError(error, "Voice could not start. Please type your request instead.");
  }
}
