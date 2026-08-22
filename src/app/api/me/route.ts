import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import { adminDb, loadUserProfile, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const profile = await loadUserProfile(userId);
    const snapshot = await adminDb
      .collection("meetups")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    const nextMeetup = snapshot.empty ? null : (() => {
      const data = snapshot.docs[0].data();
      return {
        title: data.title as string,
        dateLabel: data.dateLabel as string,
        timeLabel: data.timeLabel as string,
        venue: data.venue as string,
      };
    })();
    return NextResponse.json({
      name: profile?.name ?? null,
      neighborhood: profile?.neighborhood ?? null,
      languages: profile?.languages ?? [],
      notes: profile?.notes?.map((note) => note.text) ?? [],
      nextMeetup,
    });
  } catch (error) {
    return routeError(error, "I could not check your details. Please try again.");
  }
}
