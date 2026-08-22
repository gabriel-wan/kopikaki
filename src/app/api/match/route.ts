import { FunctionCallingConfigMode, ThinkingLevel, Type } from "@google/genai";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import {
  meetupParticipantIds,
  openMeetupCandidate,
  parseCandidate,
  parseMatchIntent,
  type Candidate,
  type MatchIntent,
  type Meetup,
} from "@/lib/domain";
import { adminDb, ensureUserProfile, requireUser } from "@/lib/firebase-admin";
import { capitalize, listPeople, meetupTime } from "@/lib/format";
import { geminiClient, MATCH_MODEL } from "@/lib/gemini";
import { parseIntentFallback } from "@/lib/intent";
import {
  loadMatchPoolConcurrently,
  type CandidatePool,
  type UnderstoodIntent,
} from "@/lib/match-pool";
import { excludeCaller, matchCandidates } from "@/lib/matcher";
import { resolveSingaporeDate } from "@/lib/memory";

export const runtime = "nodejs";

async function candidates(collectionName: "kakis" | "groups" | "activities") {
  const snapshot = await adminDb.collection(collectionName).get();
  return snapshot.docs.map((doc) => parseCandidate(doc.id, doc.data()));
}

async function requireUserName(userId: string): Promise<string> {
  const profile = await ensureUserProfile(userId);
  if (!profile) throw new Error("Your profile is missing. Please reseed the demo data.");
  return profile.name;
}

async function understandIntent(
  intent: MatchIntent,
  rawRequest: string,
  askGemini: boolean,
): Promise<UnderstoodIntent> {
  let source: "gemini-tool" | "local" = "local";
  let understoodIntent = intent;
  const ai = askGemini ? geminiClient() : null;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MATCH_MODEL,
        contents:
          "Extract the activity, time of day, Singapore neighbourhood, and preferred language. " +
          "Understand Singlish and local languages, then call load_match_pool. Request: " +
          rawRequest,
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
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ["load_match_pool"],
            },
          },
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

  return { source, intent: understoodIntent };
}

// Meetups the caller could still join: today onwards, and not ones they are already in.
// ponytail: single-field range query (auto-indexed) plus an in-memory filter — a room of
// seniors, not a scale problem. Add a composite index if this ever outgrows that.
async function openMeetups(userId: string): Promise<Candidate[]> {
  const snapshot = await adminDb
    .collection("meetups")
    .where("localDate", ">=", resolveSingaporeDate("today"))
    .get();
  return snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }) as Meetup)
    .filter((meetup) => !meetupParticipantIds(meetup).includes(userId))
    .map(openMeetupCandidate)
    .filter((candidate): candidate is Candidate => candidate !== null);
}

async function loadCandidates(userId: string): Promise<CandidatePool> {
  const [meetups, people, groups, activities] = await Promise.all([
    openMeetups(userId),
    candidates("kakis"),
    candidates("groups"),
    candidates("activities"),
  ]);
  return { meetups, people, groups, activities };
}

function describeMatch(match: Candidate, intent: MatchIntent, isNearby: boolean): string {
  const where = isNearby ? "nearby" : `in ${match.neighborhood}`;
  if (match.kind === "meetup") {
    const going = match.members ?? [];
    const who = going.length
      ? `${listPeople(going)} ${going.length === 1 ? "is" : "are"} already going`
      : "This meetup is already arranged";
    return `${who}, ${where} at ${match.venue ?? match.neighborhood}. There is room for you to join.`;
  }
  return (
    `${match.name} is ${isNearby ? "nearby" : `available ${where}`}, speaks ` +
    `${match.languages.join(" and ")}, and also enjoys ${intent.activity}.`
  );
}

async function loadMatchPool(
  intent: MatchIntent,
  rawRequest: string,
  askGemini: boolean,
  userId: string,
) {
  const startedAt = performance.now();
  let geminiMs = 0;
  let firestoreMs = 0;
  const pool = await loadMatchPoolConcurrently(
    async () => {
      const stageStartedAt = performance.now();
      try {
        return await understandIntent(intent, rawRequest, askGemini);
      } finally {
        geminiMs = performance.now() - stageStartedAt;
      }
    },
    async () => {
      const stageStartedAt = performance.now();
      try {
        return await loadCandidates(userId);
      } finally {
        firestoreMs = performance.now() - stageStartedAt;
      }
    },
  );
  console.info(
    `[match-pool] source=${pool.source} geminiMs=${Math.round(geminiMs)} ` +
      `firestoreMs=${Math.round(firestoreMs)} totalMs=${Math.round(performance.now() - startedAt)}`,
  );
  return pool;
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
    const [pool, userName] = await Promise.all([
      loadMatchPool(requestedIntent, rawRequest, !confirm, userId),
      requireUserName(userId),
    ]);
    // Makes this caller findable by whoever calls next — the fallback order (People→Groups→Activities)
    // only has real supply if callers themselves become "People."
    await adminDb.collection("kakis").doc(userId).set({
      kind: "person",
      name: userName,
      activities: [pool.intent.activity],
      times: [pool.intent.timeOfDay],
      neighborhood: pool.intent.neighborhood,
      languages: [pool.intent.language],
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    const result = matchCandidates(pool.intent, {
      ...pool,
      people: excludeCaller(pool.people, userId),
    });
    if (!result.match) {
      return NextResponse.json({
        match: null,
        attempted: result.attempted,
        source: pool.source,
        intent: pool.intent,
      });
    }

    const reason = describeMatch(result.match, pool.intent, result.isNearby);
    if (!confirm) {
      return NextResponse.json({
        match: result.match,
        reason,
        attempted: result.attempted,
        source: pool.source,
        intent: pool.intent,
      });
    }

    // Joining an existing meetup instead of booking a parallel one. The transaction keeps
    // two callers joining at the same moment from overwriting each other's seat.
    if (result.match.kind === "meetup") {
      const joinedRef = adminDb.collection("meetups").doc(result.match.id);
      const joined = await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(joinedRef);
        const existing = snapshot.data();
        if (!existing) throw new Error("That meetup is no longer available.");
        const current = { ...existing, id: joinedRef.id } as Meetup;
        const participantIds = meetupParticipantIds(current);
        const participantNames = current.participantNames ?? [];
        const next = {
          participantIds: participantIds.includes(userId)
            ? participantIds
            : [...participantIds, userId],
          participantNames: participantNames.includes(userName)
            ? participantNames
            : [...participantNames, userName],
        };
        transaction.update(joinedRef, next);
        const merged: Record<string, unknown> = { ...current, ...next };
        delete merged.createdAt; // a Firestore Timestamp is not part of the Meetup contract
        return merged as Meetup;
      });
      return NextResponse.json({
        meetup: joined,
        joined: true,
        match: result.match,
        reason,
        attempted: result.attempted,
      });
    }

    const meetupRef = adminDb.collection("meetups").doc();
    const meetup: Meetup = {
      id: meetupRef.id,
      userId,
      title: capitalize(pool.intent.activity) + " with " + result.match.name,
      dateLabel: "Tomorrow",
      localDate: resolveSingaporeDate("tomorrow"),
      timeLabel: meetupTime[pool.intent.timeOfDay],
      venue: result.match.venue ?? result.match.neighborhood + " Community Club",
      neighborhood: result.match.neighborhood,
      status: "confirmed",
      matchedKind: result.match.kind,
      matchedId: result.match.id,
      participantIds: [userId],
      participantNames: [userName, ...(result.match.members ?? [result.match.name])],
      reason,
      activity: pool.intent.activity,
      timeOfDay: pool.intent.timeOfDay,
      languages: [pool.intent.language],
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
