"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Candidate, MatchIntent, Meetup } from "@/lib/domain";
import { apiPost, db, signInDemoUser } from "@/lib/firebase-client";
import { BottomNav, type Tab } from "./bottom-nav";
import { CallScreen } from "./call-screen";
import { HomeScreen } from "./home-screen";
import { KakisScreen } from "./kakis-screen";
import { MatchScreen } from "./match-screen";

type Proposal = { match: Candidate; reason: string; attempted: string[] };

export function HeroApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [intent, setIntent] = useState<MatchIntent | null>(null);
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [kakis, setKakis] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab, proposal]);

  useEffect(() => {
    let unsubscribeMeetups = () => {};
    let unsubscribeKakis = () => {};
    signInDemoUser().then((user) => {
      if (!user) return;
      unsubscribeMeetups = onSnapshot(query(collection(db, "meetups"), where("userId", "==", user.uid)), (snapshot) => {
        const meetups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Meetup);
        setMeetup(meetups.at(-1) ?? null); setLoading(false);
      });
      unsubscribeKakis = onSnapshot(collection(db, "kakis"), (snapshot) => setKakis(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Candidate)));
    }).catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : "Start the Firebase emulators and seed the demo data."); setLoading(false); });
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => { unsubscribeMeetups(); unsubscribeKakis(); };
  }, []);

  async function preview(transcript: string) {
    setError("");
    const result = await apiPost<{ match: Candidate | null; reason: string; attempted: string[]; intent: MatchIntent }>("/api/match", { transcript, confirm: false });
    if (!result.match) throw new Error("I tried people, groups, and activities, but nothing suitable is available yet.");
    setIntent(result.intent); setProposal({ ...result, match: result.match });
  }

  async function confirm() {
    if (!intent) return;
    setBusy(true); setError("");
    try {
      const result = await apiPost<{ meetup: Meetup }>("/api/match", { intent, confirm: true });
      setMeetup(result.meetup); setProposal(null); setTab("home"); return result.meetup;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not confirm the meetup."); }
    finally { setBusy(false); }
  }

  return <div className="app-shell">{proposal && intent ? <MatchScreen candidate={proposal.match} reason={proposal.reason} intent={intent} busy={busy} error={error} onBack={() => setProposal(null)} onConfirm={confirm} /> : tab === "call" ? <CallScreen onBack={() => setTab("home")} onTranscript={preview} /> : tab === "kakis" ? <KakisScreen kakis={kakis} loading={loading} /> : <HomeScreen meetup={meetup} loading={loading} onCall={() => setTab("call")} onKakis={() => setTab("kakis")} />}{error && !proposal && <p className="global-error" role="alert">{error}</p>}{!proposal && <BottomNav active={tab} onChange={setTab} />}</div>;
}
