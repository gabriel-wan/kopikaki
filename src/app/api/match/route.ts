import { ThinkingLevel, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import type { Candidate, MatchIntent, Meetup } from "@/lib/domain";
import { adminDb, requireUser } from "@/lib/firebase-admin";
import { geminiClient, MATCH_MODEL } from "@/lib/gemini";
import { parseIntentFallback } from "@/lib/intent";
import { matchCandidates } from "@/lib/matcher";

export const runtime = "nodejs";

async function candidates(collectionName: "kakis" | "groups" | "activities") {
  const snapshot = await adminDb.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Candidate);
}

async function loadMatchPool(intent: MatchIntent, rawRequest: string, askGemini: boolean) {
  let source: "gemini-tool" | "local" = "local";
  let understoodIntent = intent;
  const ai = askGemini ? geminiClient() : null;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MATCH_MODEL,
        contents: `Understand this Singapore senior's request, including Singlish, then call load_match_pool so the server can read Firestore: ${rawRequest}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          tools: [{ functionDeclarations: [{ name: "load_match_pool", description: "Loads matching candidates from Firestore in the fixed order People, then Groups, then Activities.", parameters: { type: Type.OBJECT, properties: { activity: { type: Type.STRING }, timeOfDay: { type: Type.STRING, enum: ["morning", "afternoon", "evening", "any"] }, neighborhood: { type: Type.STRING }, language: { type: Type.STRING } }, required: ["activity", "timeOfDay", "neighborhood", "language"] } }] }],
        },
      });
      const call = response.functionCalls?.find((item) => item.name === "load_match_pool");
      if (call?.args && typeof call.args.activity === "string" && typeof call.args.timeOfDay === "string" && typeof call.args.neighborhood === "string" && typeof call.args.language === "string") {
        understoodIntent = { activity: call.args.activity, timeOfDay: call.args.timeOfDay as MatchIntent["timeOfDay"], neighborhood: call.args.neighborhood, language: call.args.language, notes: rawRequest };
        source = "gemini-tool";
      }
    } catch {
      // The deterministic matcher keeps the local demo usable if Gemini is temporarily unavailable.
    }
  }
  // Execute the Gemini-requested database tool in the binding fallback order.
  const people = await candidates("kakis");
  const groups = await candidates("groups");
  const activities = await candidates("activities");
  return { people, groups, activities, source, intent: understoodIntent };
}

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const body = (await request.json()) as { intent?: MatchIntent; transcript?: string; confirm?: boolean };
    const rawRequest = body.transcript?.trim() || body.intent?.notes || "";
    const requestedIntent = body.intent ?? (rawRequest ? parseIntentFallback(rawRequest) : null);
    if (!requestedIntent?.activity || !requestedIntent.neighborhood || !requestedIntent.language) {
      return NextResponse.json({ error: "I need a little more detail before I can find someone." }, { status: 400 });
    }

    const pool = await loadMatchPool(requestedIntent, rawRequest || JSON.stringify(requestedIntent), !body.confirm);
    const result = matchCandidates(pool.intent, pool.people, pool.groups, pool.activities);
    if (!result.match) return NextResponse.json({ match: null, attempted: result.attempted, source: pool.source, intent: pool.intent });

    const reason = `${result.match.name} is nearby, speaks ${result.match.languages.join(" and ")}, and also enjoys ${pool.intent.activity}.`;
    if (!body.confirm) return NextResponse.json({ match: result.match, reason, attempted: result.attempted, source: pool.source, intent: pool.intent });

    const meetupRef = adminDb.collection("meetups").doc();
    const meetup: Meetup = {
      id: meetupRef.id,
      userId,
      title: `${pool.intent.activity[0].toLocaleUpperCase()}${pool.intent.activity.slice(1)} with ${result.match.name}`,
      dateLabel: "Tomorrow",
      timeLabel: pool.intent.timeOfDay === "any" ? "9:30 AM" : pool.intent.timeOfDay === "morning" ? "9:30 AM" : pool.intent.timeOfDay === "afternoon" ? "2:30 PM" : "6:30 PM",
      venue: result.match.venue ?? `${pool.intent.neighborhood} Community Club`,
      neighborhood: pool.intent.neighborhood,
      status: "confirmed",
      matchedKind: result.match.kind,
      matchedId: result.match.id,
      participantNames: ["You", ...(result.match.members ?? [result.match.name])],
      reason,
    };
    await meetupRef.set({ ...meetup, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ meetup, match: result.match, reason, attempted: result.attempted });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "I could not finish the match." }, { status: 401 });
  }
}
