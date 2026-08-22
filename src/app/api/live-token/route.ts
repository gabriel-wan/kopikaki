import { NextResponse } from "next/server";
import { Modality } from "@google/genai";

import { routeError } from "@/lib/api-error";
import type { UserProfile } from "@/lib/domain";
import { loadUserProfile, requireUser } from "@/lib/firebase-admin";
import { geminiClient, LIVE_MODEL } from "@/lib/gemini";
import {
  CONFIRM_KAKI_MATCH,
  FIND_AVAILABILITY,
  FORGET_NOTE,
  MY_STATUS,
  PROPOSE_KAKI_MATCH,
  REMEMBER_NOTE,
  SET_AVAILABILITY,
  UPDATE_PROFILE,
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
    "Speak in short, plain sentences — one idea per reply, never a paragraph. Elderly callers find long or complex sentences tiring, so keep every reply to one or two short sentences, then pause for them to respond. " +
    `You are KopiKaki, a warm concise Singapore social concierge ${who}${home}.${speaks}${known} ` +
    "Ask what they feel like doing, when, and where. Understand Singlish and English, Mandarin, Malay, Tamil, or Hokkien. Guide them toward a real meetup. " +
    `When you understand their request, call ${PROPOSE_KAKI_MATCH} with a short paraphrase of it, not the raw transcript. State the match in one short sentence, or say plainly if nothing is available yet. ` +
    `Only call ${CONFIRM_KAKI_MATCH} after they give a clear verbal yes. Once confirmed, say a short goodbye and stop talking. ` +
    `Call ${REMEMBER_NOTE} when they share something lasting about themselves — a preference, a physical limit, or life context, not a one-off statement. Only store what they actually said, never what you infer. ` +
    `Call ${FORGET_NOTE} when they say something you remembered is no longer true. ` +
    `Call ${SET_AVAILABILITY} when they state a time window they are free, or no longer free, for an activity. ` +
    `Call ${FIND_AVAILABILITY} whenever they ask who else is free today — even a vague "who's around", with no activity or time named. Omit whatever they didn't say rather than guessing, and only answer from what the tool returns, never from a guess. ` +
    `Call ${UPDATE_PROFILE} when they mention where they live or what language they'd rather use. ` +
    `Call ${MY_STATUS} when they ask what's arranged for them or what you remember about them.`
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
