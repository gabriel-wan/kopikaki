"use client";

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";

import {
  parseCandidate,
  type Candidate,
  type MatchIntent,
  type MatchTier,
  type Meetup,
} from "@/lib/domain";
import { apiPost, auth, connectLocalFirebase, db } from "@/lib/firebase-client";
import { AccountScreen } from "./account-screen";
import { Brand } from "./brand";
import { BottomNav, type Tab } from "./bottom-nav";
import { CallScreen } from "./call-screen";
import { HomeScreen } from "./home-screen";
import { KakisScreen } from "./kakis-screen";
import { MatchScreen } from "./match-screen";

type Proposal = {
  match: Candidate;
  reason: string;
  attempted: MatchTier[];
  intent: MatchIntent;
};

export function HeroApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [kakis, setKakis] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab, proposal]);

  useEffect(() => {
    let disposed = false;
    const subscriptions: Unsubscribe[] = [];

    connectLocalFirebase();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
      setSignedIn(Boolean(user));
      setUserName(user?.displayName ?? "");
      setAuthReady(true);
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      void Promise.resolve(user)
      .then((user) => {
        if (!user || disposed) return;
        const meetupQuery = query(
          collection(db, "meetups"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1),
        );
        subscriptions.push(
          onSnapshot(
            meetupQuery,
            (snapshot) => {
              setMeetup(
                snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Meetup).at(0) ??
                  null,
              );
              setLoading(false);
            },
            (cause) => {
              setError(cause.message);
              setLoading(false);
            },
          ),
          onSnapshot(
            collection(db, "kakis"),
            (snapshot) => {
              try {
                setKakis(snapshot.docs.map((doc) => parseCandidate(doc.id, doc.data())));
              } catch {
                setError("Kaki data is incomplete. Please reseed the demo data.");
              }
            },
            (cause) => setError(cause.message),
          ),
        );
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Start the Firebase emulators and seed the demo data.",
        );
        setLoading(false);
      });
    });

    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        void navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister())),
          )
          .then(async () => {
            if (!("caches" in window)) return;
            const keys = await caches.keys();
            await Promise.all(
              keys
                .filter((key) => key.startsWith("kopikaki-"))
                .map((key) => caches.delete(key)),
            );
          })
          .catch(() => undefined);
      }
    }
    return () => {
      disposed = true;
      unsubscribeAuth();
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  async function preview(transcript: string) {
    setError("");
    const result = await apiPost<{
      match: Candidate | null;
      reason: string;
      attempted: MatchTier[];
      intent: MatchIntent;
    }>("/api/match", { transcript, confirm: false });
    if (!result.match) {
      throw new Error(
        "I tried people, groups, and activities, but nothing suitable is available yet.",
      );
    }
    setProposal({ ...result, match: result.match });
  }

  async function confirm() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiPost<{ meetup: Meetup }>("/api/match", {
        intent: proposal.intent,
        confirm: true,
      });
      setMeetup(result.meetup);
      setProposal(null);
      setTab("home");
      return result.meetup;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm the meetup.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setError("");
    try {
      await signOut(auth);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not log out. Please try again.");
    }
  }

  return (
    <div className="app-shell">
      {!authReady ? <main className="screen auth-loading"><Brand /><p>Opening KopiKaki…</p></main> : !signedIn ? <AccountScreen /> : proposal ? (
        <MatchScreen
          candidate={proposal.match}
          reason={proposal.reason}
          intent={proposal.intent}
          attempted={proposal.attempted}
          busy={busy}
          error={error}
          onBack={() => setProposal(null)}
          onConfirm={confirm}
        />
      ) : tab === "call" ? (
        <CallScreen onBack={() => setTab("home")} onTranscript={preview} />
      ) : tab === "kakis" ? (
        <KakisScreen kakis={kakis} loading={loading} />
      ) : (
        <HomeScreen
          meetup={meetup}
          loading={loading}
          userName={userName}
          onCall={() => setTab("call")}
          onLogout={logout}
        />
      )}
      {signedIn && error && !proposal && (
        <p className="global-error" role="alert">
          {error}
        </p>
      )}
      {signedIn && !proposal && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}
