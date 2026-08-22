import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import { adminDb, loadUserProfile, requireUser } from "@/lib/firebase-admin";
import {
  appendMemoryNote,
  availabilityId,
  parseMemoryNotes,
  parseMemoryOperation,
  removeMemoryNote,
  windowsOverlap,
} from "@/lib/memory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const body: unknown = await request.json();

    let op;
    try {
      op = parseMemoryOperation(body);
    } catch (cause) {
      return NextResponse.json(
        { error: cause instanceof Error ? cause.message : "I didn't catch that." },
        { status: 400 },
      );
    }

    if (op.operation === "remember_note") {
      const userRef = adminDb.collection("users").doc(userId);
      const snapshot = await userRef.get();
      const notes = appendMemoryNote(parseMemoryNotes(snapshot.data()?.notes), {
        ...op.args,
        createdAt: new Date().toISOString(),
      });
      await userRef.set({ notes }, { merge: true });
      return NextResponse.json({ saved: true });
    }

    if (op.operation === "forget_note") {
      const userRef = adminDb.collection("users").doc(userId);
      const snapshot = await userRef.get();
      const before = parseMemoryNotes(snapshot.data()?.notes);
      const after = removeMemoryNote(before, op.args.text);
      await userRef.set({ notes: after }, { merge: true });
      return NextResponse.json({ removed: after.length < before.length });
    }

    if (op.operation === "set_availability") {
      const ref = adminDb.collection("availability").doc(
        availabilityId(userId, op.args.activityKey, op.args.localDate, op.args.startMinute, op.args.endMinute),
      );
      if (!op.args.available) {
        await ref.delete();
        return NextResponse.json({ saved: true });
      }
      const profile = await loadUserProfile(userId);
      await ref.set({
        userId,
        name: profile?.name ?? "A kaki",
        activity: op.args.activity,
        activityKey: op.args.activityKey,
        localDate: op.args.localDate,
        startTime: op.args.startTime,
        endTime: op.args.endTime,
        startMinute: op.args.startMinute,
        endMinute: op.args.endMinute,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ saved: true });
    }

    // find_availability — date is the only field always present (activity/time are optional
    // for an open-ended "who's free today" question), so it's the one field queried on.
    // ponytail: single-field query (auto-indexed) + in-memory filter — a room of seniors,
    // not a scale problem. Add a composite index if this collection ever grows past that.
    const snapshot = await adminDb
      .collection("availability")
      .where("localDate", "==", op.args.localDate)
      .get();
    const { activityKey, startMinute, endMinute } = op.args;
    const matches = snapshot.docs
      .map((doc) => doc.data())
      .filter((data) =>
        data.userId !== userId &&
        (!activityKey || data.activityKey === activityKey) &&
        (startMinute === undefined || (endMinute !== undefined && windowsOverlap(data.startMinute, data.endMinute, startMinute, endMinute))));
    return NextResponse.json({
      matches: matches.map((data) => ({
        name: data.name as string,
        activity: data.activity as string,
        startTime: data.startTime as string,
        endTime: data.endTime as string,
      })),
    });
  } catch (error) {
    return routeError(error, "I could not update memory. Please try again.");
  }
}
