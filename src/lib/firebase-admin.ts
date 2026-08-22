import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "kopikaki-local";

if (process.env.NODE_ENV !== "production") {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
}

const app =
  getApps()[0] ??
  initializeApp(
    process.env.NODE_ENV === "production"
      ? { credential: applicationDefault(), projectId }
      : { projectId },
  );

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export async function requireUser(request: Request): Promise<string> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("Please sign in again.");
  const token = await adminAuth.verifyIdToken(header.slice(7));
  return token.uid;
}
