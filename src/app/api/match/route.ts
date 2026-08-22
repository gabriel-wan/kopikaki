import { ThinkingLevel, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import {
  parseCandidate,
  parseMatchIntent,
  type MatchIntent,
  type Meetup,
} from "@/lib/domain";
import { adminDb, requireUser } from "@/lib/firebase-admin";
import { capitalize, meetupTime } from "@/lib/format";
import { geminiClient, MATCH_MODEL } from "@/lib/gemini";
import { parseIntentFallback } from "@/lib/intent";
import { matchCandidates } from "@/lib/matcher";

export const runtime = "nodejs";

async function candidates(collectionName: "kakis" | "groups" | "activities") {
  const snapshot = await adminDb.collection(collectionName).get();
  return snapshot.docs.map((doc) => parseCandidate(doc.id, doc.data()));
}

async function loadMatchPool(intent: MatchIntent, rawRequest: string, askGemini: boolean) {
  let source: "gemini-tool" | "local" = "local";
  let understoodIntent = intent;
  const ai = askGemini ? geminiClient() : null;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MATCH_MODEL,
        contents: "Understand this Singapore senior's request, including Singlish, then call load_match_pool so the server can read Firestore: " + rawRequest,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          tools: [{
            functionDeclarations: [{
              name: "load_match_pool",
              description: "Loads matching candidates from Firestore in the fixed order People, then Groups, then Activities.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  activity: { type: Type.STRING },
                  timeOfDay: { type: Type.STRING, enum: ["morning", "afternoon", "evening", "any"] },
                  neighborhood: { type: Type.STRING },
                  language: { type: Type.STRING },
                },
                required: ["activity", "timeOfDay", "neighborhood", "language"],
              },
            }],
          }],
        },
      });
      const call = response.functionCalls?.find((item) => item.name === "load_match_pool");
      if (call?.args) {
        understoodIntent = parseMatchIntent({ ...call.args, notes: rawRequest });
        source = "gemini-tool";
      }
    } catch {
      // The deterministic parser keeps the demo usable if Gemini is unavailable or returns invalid arguments.
    }
  }

  const [people, groups, activities] = await Promise.all([
    candidates("kakis"),
    candidates("groups"),
    candidates("activities"),
  ]);
  return { people, groups, activities, source, intent: understoodIntent };
}

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please tell me what you feel like doing." }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const transcript = typeof values.transcript === "string" ? values.transcript.trim() : "";
    let requestedIntent: MatchIntent;
    try {
      requestedIntent = values.intent === undefined
        ? parseIntentFallback(transcript)
        : parseMatchIntent(values.intent);
      if (values.intent === undefined && transcript.length < 3) {
        throw new Error("Request is too short.");
      }
    } catch {
      return NextResponse.json(
        { error: "I need a little more detail before I can find someone." },
        { status: 400 },
      );
    }

    const confirm = values.confirm === true;
    const rawRequest = transcript || requestedIntent.notes || JSON.stringify(requestedIntent);
    const pool = await loadMatchPool(requestedIntent, rawRequest, !confirm);
    const result = matchCandidates(pool.intent, pool.people, pool.groups, pool.activities);
    if (!result.match) {
      return NextResponse.json({
        match: null,
        attempted: result.attempted,
        source: pool.source,
        intent: pool.intent,
      });
    }

    const locationText = result.isNearby
      ? result.match.name + " is nearby"
      : result.match.name + " is available in " + result.match.neighborhood;
    const reason = locationText + ", speaks " + result.match.languages.join(" and ") + ", and also enjoys " + pool.intent.activity + ".";
    if (!confirm) {
      return NextResponse.json({
        match: result.match,
        reason,
        attempted: result.attempted,
        source: pool.source,
        intent: pool.intent,
      });
    }

    const meetupRef = adminDb.collection("meetups").doc();
    const meetup: Meetup = {
      id: meetupRef.id,
      userId,
      title: capitalize(pool.intent.activity) + " with " + result.match.name,
      dateLabel: "Tomorrow",
      timeLabel: meetupTime[pool.intent.timeOfDay],
      venue: result.match.venue ?? result.match.neighborhood + " Community Club",
      neighborhood: result.match.neighborhood,
      status: "confirmed",
      matchedKind: result.match.kind,
      matchedId: result.match.id,
      participantNames: ["You", ...(result.match.members ?? [result.match.name])],
      reason,
    };
    await meetupRef.set({ ...meetup, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({
      meetup,
      match: result.match,
      reason,
      attempted: result.attempted,
    });
  } catch (error) {
    return routeError(error, "I could not finish the match. Please try again.");
  }
}
