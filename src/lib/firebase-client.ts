import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

import {
  authEmulatorPort,
  firebaseProjectId,
  firestoreEmulatorPort,
  useFirebaseEmulators,
} from "./firebase-config";

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

export async function signInDemoUser() {
  connectLocalFirebase();
  if (!auth.currentUser) {
    const email = process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ?? "david@kopikaki.local";
    const password = process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD ?? "kopikaki-demo";
    await signInWithEmailAndPassword(auth, email, password);
  }
  return auth.currentUser;
}

export async function apiPost<T>(path: string, body: object = {}): Promise<T> {
  const user = await signInDemoUser();
  if (!user) throw new Error("Demo sign-in failed.");
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
