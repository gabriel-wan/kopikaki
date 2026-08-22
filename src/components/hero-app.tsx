"use client";

import {
  collection,
  doc,
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
import { resolveSingaporeDate } from "@/lib/memory";
import { nextMeetup, parseFreeWindow, type FreeWindow } from "@/lib/schedule";
import { AccountScreen } from "./account-screen";
import { Brand } from "./brand";
import { BottomNav, type Tab } from "./bottom-nav";
import { CallScreen } from "./call-screen";
import { ChatScreen } from "./chat-screen";
import { HomeScreen } from "./home-screen";
import { KakisScreen } from "./kakis-screen";
import { MatchFoundScreen } from "./match-found-screen";
import { MatchScreen } from "./match-screen";
import { MeetupDetailScreen } from "./meetup-detail-screen";
import { ScheduleScreen } from "./schedule-screen";

type Proposal = {
  match: Candidate;
  reason: string;
  attempted: MatchTier[];
  intent: MatchIntent;
};

// A meetup drilled into, either straight after confirming it or from a card.
type MeetupView = { kind: "confirmed" | "detail"; meetup: Meetup; joined: boolean };

export function HeroApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [homeCalling, setHomeCalling] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [windows, setWindows] = useState<FreeWindow[]>([]);
  const [view, setView] = useState<MeetupView | null>(null);
  // The greeting uses the login name (userName); this is the profile name the server
  // writes into participantNames, so the detail screen can tell which one is you.
  const [profileName, setProfileName] = useState("");
  const [kakis, setKakis] = useState<Candidate[]>([]);
  const [chatWith, setChatWith] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab, homeCalling, proposal, view]);

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
          where("participantIds", "array-contains", user.uid),
          orderBy("createdAt", "desc"),
          limit(30),
        );
        subscriptions.push(
          onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            const profile = snapshot.data();
            setProfileName(((profile?.preferredName ?? profile?.name) as string | undefined) ?? "");
          }),
          onSnapshot(
            meetupQuery,
            (snapshot) => {
              setMeetups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Meetup));
              setLoading(false);
            },
            (cause) => {
              setError(cause.message);
              setLoading(false);
            },
          ),
          onSnapshot(
            query(collection(db, "availability"), where("userId", "==", user.uid)),
            (snapshot) => {
              setWindows(
                snapshot.docs
                  .map((doc) => parseFreeWindow(doc.id, doc.data()))
                  .filter((window): window is FreeWindow => window !== null),
              );
            },
            (cause) => setError(cause.message),
          ),
          onSnapshot(
            collection(db, "users", user.uid, "kakis"),
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
      const result = await apiPost<{ meetup: Meetup; joined?: boolean }>("/api/match", {
        intent: proposal.intent,
        confirm: true,
      });
      setMeetups((existing) => [
        result.meetup,
        ...existing.filter((item) => item.id !== result.meetup.id),
      ]);
      setProposal(null);
      setTab("home");
      setHomeCalling(false);
      setView({ kind: "confirmed", meetup: result.meetup, joined: result.joined === true });
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

  function openCall() {
    setChatWith(null);
    setView(null);
    setTab("home");
    setHomeCalling(true);
  }

  function openMeetup(meetupId: string) {
    const meetup = meetups.find((item) => item.id === meetupId);
    if (meetup) setView({ kind: "detail", meetup, joined: false });
  }

  // Keep the open meetup in step with Firestore, so a kaki joining while it is on screen
  // shows up straight away.
  const openView = view
    ? { ...view, meetup: meetups.find((item) => item.id === view.meetup.id) ?? view.meetup }
    : null;
  // Full-screen views that replace the tabs: hide the nav and the error banner behind them.
  const overlay = Boolean(proposal || openView || chatWith || homeCalling);

  return (
    <div className="app-shell">
      {!authReady ? <main className="screen auth-loading"><Brand /><p>Opening KopiKaki…</p></main> : !signedIn ? <AccountScreen /> : chatWith ? (
        <ChatScreen
          kaki={chatWith}
          onBack={() => setChatWith(null)}
          onCall={openCall}
        />
      ) : proposal ? (
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
      ) : openView?.kind === "confirmed" ? (
        <MatchFoundScreen
          meetup={openView.meetup}
          joined={openView.joined}
          onView={() => setView({ ...openView, kind: "detail" })}
          onHome={() => setView(null)}
        />
      ) : openView?.kind === "detail" ? (
        <MeetupDetailScreen
          meetup={openView.meetup}
          currentUserName={profileName}
          onBack={() => setView(null)}
          onCall={openCall}
        />
      ) : homeCalling ? (
        <CallScreen onBack={() => setHomeCalling(false)} onTranscript={preview} />
      ) : tab === "schedule" ? (
        <ScheduleScreen
          meetups={meetups}
          windows={windows}
          loading={loading}
          onAdd={openCall}
          onOpenMeetup={openMeetup}
        />
      ) : tab === "kakis" ? (
        <KakisScreen kakis={kakis} loading={loading} onCall={openCall} onSelect={setChatWith} />
      ) : (
        <HomeScreen
          meetup={nextMeetup(meetups, resolveSingaporeDate("today"))}
          loading={loading}
          userName={userName}
          onCall={openCall}
          onLogout={logout}
          onOpenMeetup={openMeetup}
        />
      )}
      {signedIn && error && !overlay && (
        <p className="global-error" role="alert">
          {error}
        </p>
      )}
      {signedIn && !overlay && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}
