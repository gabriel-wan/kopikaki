import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

import {
  authEmulatorPort,
  firebaseProjectId,
  firestoreEmulatorPort,
  useFirebaseEmulators,
} from "./firebase-config";
import { loginNameToEmail } from "./account";

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-key",
      authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
        firebaseProjectId + ".firebaseapp.com",
      projectId: firebaseProjectId,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "kopikaki-demo",
    });

export const auth = getAuth(app);
export const db = getFirestore(app);

let connected = false;
export function connectLocalFirebase() {
  if (connected || typeof window === "undefined" || !useFirebaseEmulators) return;
  const host = window.location.hostname;
  connectAuthEmulator(auth, "http://" + host + ":" + authEmulatorPort, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, host, firestoreEmulatorPort);
  connected = true;
}

export async function signIn(loginName: string, password: string) {
  connectLocalFirebase();
  return signInWithEmailAndPassword(auth, loginNameToEmail(loginName), password);
}

export async function createAccount(loginName: string, password: string) {
  connectLocalFirebase();
  const normalizedName = loginName.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(
    auth,
    loginNameToEmail(normalizedName),
    password,
  );
  await updateProfile(credential.user, { displayName: normalizedName });
  await apiPost("/api/profile", { name: normalizedName, loginName: normalizedName });
  return credential.user;
}

export async function requireSignedInUser() {
  connectLocalFirebase();
  if (!auth.currentUser) throw new Error("Please sign in first.");
  return auth.currentUser;
}

export async function apiPost<T>(path: string, body: object = {}): Promise<T> {
  const user = await requireSignedInUser();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + (await user.getIdToken()),
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Something went wrong. Please try again.");
  }
  return result;
}
