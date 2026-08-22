import { NextResponse } from "next/server";

import { routeError } from "@/lib/api-error";
import { loginNameToEmail } from "@/lib/account";
import { adminDb, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const userId = await requireUser(request);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Please choose a KopiKaki name." }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    if (typeof values.name !== "string" || typeof values.loginName !== "string") {
      return NextResponse.json({ error: "Please choose a KopiKaki name." }, { status: 400 });
    }
    const loginName = values.loginName.trim().toLowerCase();
    loginNameToEmail(loginName);
    await adminDb.collection("users").doc(userId).set({
      name: values.name.trim() || loginName,
      preferredName: values.name.trim() || loginName,
      loginName,
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error, "I could not save your profile. Please try again.");
  }
}
