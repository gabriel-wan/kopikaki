import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { UnauthorizedError } from "./api-error";
import { parseUserProfile, type UserProfile } from "./domain";
import { profileFieldsFromAuthDisplayName } from "./profile-recovery";
import {
  authEmulatorPort,
  firebaseProjectId,
  firestoreEmulatorPort,
  useFirebaseEmulators,
} from "./firebase-config";

const projectId = process.env.FIREBASE_PROJECT_ID ?? firebaseProjectId;

if (useFirebaseEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST ??= `127.0.0.1:${firestoreEmulatorPort}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `127.0.0.1:${authEmulatorPort}`;
}

const app =
  getApps()[0] ??
  initializeApp(
    !useFirebaseEmulators
      ? { credential: applicationDefault(), projectId }
      : { projectId },
  );

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export async function requireUser(request: Request): Promise<string> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
  try {
    const token = await adminAuth.verifyIdToken(header.slice(7));
    return token.uid;
  } catch {
    throw new UnauthorizedError();
  }
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await adminDb.collection("users").doc(userId).get();
  if (!snapshot.exists) return null;
  try {
    return parseUserProfile(snapshot.data());
  } catch {
    return null; // malformed profile — callers decide how to degrade
  }
}

export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  const existing = await loadUserProfile(userId);
  if (existing) return existing;

  const fields = profileFieldsFromAuthDisplayName((await adminAuth.getUser(userId)).displayName);
  if (!fields) return null;

  try {
    await adminDb.collection("users").doc(userId).create(fields);
  } catch {
    return loadUserProfile(userId);
  }
  return { name: fields.name };
}
