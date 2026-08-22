import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import { chatId, parseChatText } from "@/lib/chat";
import { adminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please write a message." }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    const kakiId = typeof values.kakiId === "string" ? values.kakiId.trim() : "";
    if (!kakiId || kakiId === userId) {
      return NextResponse.json({ error: "Could not find that kaki." }, { status: 400 });
    }

    let text: string;
    try {
      text = parseChatText(values.text);
    } catch (cause) {
      return NextResponse.json(
        { error: cause instanceof Error ? cause.message : "Message is invalid." },
        { status: 400 },
      );
    }

    const account = await adminDb.collection("users").doc(kakiId).get();
    if (!account.exists) {
      return NextResponse.json({ error: "This kaki isn't on KopiKaki yet." }, { status: 400 });
    }

    const chatRef = adminDb.collection("chats").doc(chatId(userId, kakiId));
    await chatRef.set(
      { participants: [userId, kakiId], updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await chatRef.collection("messages").add({
      senderId: userId,
      text,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ sent: true });
  } catch (error) {
    return routeError(error, "I could not send that message. Please try again.");
  }
}
