import { NextResponse } from "next/server";
import { Modality } from "@google/genai";

import { routeError } from "@/lib/api-error";
import type { UserProfile } from "@/lib/domain";
import { loadUserProfile, requireUser } from "@/lib/firebase-admin";
import { geminiClient, LIVE_MODEL } from "@/lib/gemini";
import {
  CONFIRM_KAKI_MATCH,
  FIND_AVAILABILITY,
  PROPOSE_KAKI_MATCH,
  REMEMBER_NOTE,
  SET_AVAILABILITY,
} from "@/lib/live-tools";

export const runtime = "nodejs";

function buildSystemInstruction(profile: UserProfile | null): string {
  const who = profile?.name ? `for ${profile.name}` : "for a caller";
  const home = profile?.neighborhood ? `, who lives in ${profile.neighborhood}` : "";
  const speaks = profile?.languages?.length ? ` They usually speak ${profile.languages.join(", ")}.` : "";
  const known = profile?.notes?.length
    ? ` Known about them: ${profile.notes.map((note) => note.text).join("; ")}.`
    : "";
  return (
    `You are KopiKaki, a warm concise Singapore social concierge ${who}${home}.${speaks}${known} ` +
    "Ask what they feel like doing, when, and where. Understand Singlish and English, Mandarin, Malay, Tamil, or Hokkien. Keep replies short and guide them toward a real meetup. " +
    `When you understand their request, call ${PROPOSE_KAKI_MATCH} with a short paraphrase of it, not the raw transcript. Speak the match reason naturally, or say plainly if nothing is available yet. ` +
    `Only call ${CONFIRM_KAKI_MATCH} after they give a clear verbal yes. Once confirmed, say a short goodbye and stop talking. ` +
    `Call ${REMEMBER_NOTE} when they share something lasting about themselves — a preference, a physical limit, or life context, not a one-off statement. Only store what they actually said, never what you infer. ` +
    `Call ${SET_AVAILABILITY} when they state a time window they are free, or no longer free, for an activity. ` +
    `Call ${FIND_AVAILABILITY} when they ask who else is free for an activity at a time, then read back who you find, or say plainly if nobody is.`
  );
}

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const ai = geminiClient();
    if (!ai) return NextResponse.json({ error: "Voice is unavailable. Please type your request below." }, { status: 503 });
    const profile = await loadUserProfile(userId);
    const systemInstruction = buildSystemInstruction(profile);
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
    return NextResponse.json({ token: token.name, model: LIVE_MODEL, systemInstruction });
  } catch (error) {
    return routeError(error, "Voice could not start. Please type your request instead.");
  }
}
