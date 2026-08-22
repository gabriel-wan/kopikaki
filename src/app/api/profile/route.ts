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
    const update: Record<string, unknown> = {};

    // Account creation always sends both; a voice-driven update sends neither.
    if (typeof values.name === "string" && typeof values.loginName === "string") {
      const loginName = values.loginName.trim().toLowerCase();
      loginNameToEmail(loginName);
      update.name = values.name.trim() || loginName;
      update.preferredName = values.name.trim() || loginName;
      update.loginName = loginName;
    }
    if (typeof values.neighborhood === "string" && values.neighborhood.trim()) {
      update.neighborhood = values.neighborhood.trim();
    }
    if (Array.isArray(values.languages) && values.languages.every((item) => typeof item === "string")) {
      const languages = (values.languages as string[]).map((item) => item.trim()).filter(Boolean);
      if (languages.length) update.languages = languages;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await adminDb.collection("users").doc(userId).set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error, "I could not save your profile. Please try again.");
  }
}
