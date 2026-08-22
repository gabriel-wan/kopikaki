import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
const projectId = "kopikaki-local";
const app = getApps()[0] ?? initializeApp({ projectId });
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  try {
    await auth.createUser({ uid: "test-user", email: "david@kopikaki.local", password: "kopikaki-demo", displayName: "David Tan" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("already exists")) throw error;
  }

  await Promise.all([
    db.collection("users").doc("test-user").set({ name: "David Tan", preferredName: "Uncle David", neighborhood: "Bishan", languages: ["English", "Mandarin", "Hokkien"] }),
    db.collection("kakis").doc("heng").set({ kind: "person", name: "Uncle Heng", activities: ["pickleball", "kopi", "chess"], times: ["morning"], neighborhood: "Bishan", languages: ["English", "Mandarin"], venue: "Bishan Sports Hall" }),
    db.collection("kakis").doc("susan").set({ kind: "person", name: "Auntie Susan", activities: ["pickleball", "walk"], times: ["morning", "afternoon"], neighborhood: "Bishan", languages: ["English", "Mandarin"], venue: "Bishan Sports Hall" }),
    db.collection("kakis").doc("raymond").set({ kind: "person", name: "Uncle Raymond", activities: ["chess", "kopi"], times: ["afternoon"], neighborhood: "Toa Payoh", languages: ["English", "Hokkien"], venue: "Toa Payoh Central" }),
    db.collection("groups").doc("bishan-active-kakis").set({ kind: "group", name: "Bishan Active Kakis", members: ["Uncle Heng", "Auntie Susan"], activities: ["walk", "pickleball"], times: ["morning"], neighborhood: "Bishan", languages: ["English", "Mandarin"], venue: "Bishan Community Club" }),
    db.collection("activities").doc("kim-keat-kopi").set({ kind: "activity", name: "Kim Keat Kopi Chat", members: ["Community host"], activities: ["kopi"], times: ["morning"], neighborhood: "Kim Keat", languages: ["English", "Mandarin", "Hokkien"], venue: "Kim Keat Café" }),
  ]);
  console.log("Seeded David and KopiKaki candidates.");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
