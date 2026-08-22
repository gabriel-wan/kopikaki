import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "kopikaki-local";
const app = getApps().length ? getApp() : initializeApp({ apiKey: "demo-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: "kopikaki-demo" });
export const auth = getAuth(app);
export const db = getFirestore(app);

let connected = false;
export function connectLocalFirebase() {
  if (connected || typeof window === "undefined") return;
  const host = window.location.hostname;
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connected = true;
}

export async function signInDemoUser() {
  connectLocalFirebase();
  if (!auth.currentUser) await signInWithEmailAndPassword(auth, "david@kopikaki.local", "kopikaki-demo");
  return auth.currentUser;
}

export async function apiPost<T>(path: string, body: object = {}): Promise<T> {
  const user = await signInDemoUser();
  if (!user) throw new Error("Demo sign-in failed.");
  const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(body) });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Something went wrong. Please try again.");
  return result;
}
