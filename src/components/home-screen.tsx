import Image from "next/image";
import { LogOut, Phone } from "lucide-react";
import type { Meetup } from "@/lib/domain";
import { Brand } from "./brand";
import { MeetupCard } from "./meetup-card";

function formatGreetingName(name: string) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function HomeScreen({ meetup, loading, userName, onCall, onLogout, onOpenMeetup }: { meetup: Meetup | null; loading: boolean; userName: string; onCall: () => void; onLogout: () => void; onOpenMeetup: (meetupId: string) => void }) {
  const greetingName = userName ? formatGreetingName(userName) : "friend";
  return <main className="screen home-screen"><header className="topbar"><Brand wordmark /><button className="logout-button" onClick={onLogout}><LogOut size={20} aria-hidden="true" />Log out</button></header><section className="greeting"><h1 className="greeting-title"><span>Good morning,</span><span>Uncle {greetingName}! 👋</span></h1><p><span>Let’s find someone to</span><span>do something fun today.</span></p></section><button className="call-card" onClick={onCall}><span className="call-content"><span className="call-icon"><Phone size={40} fill="currentColor" aria-hidden="true" /></span><span className="call-copy"><strong>Call KopiKaki</strong><span>Talk to your AI social<br />concierge</span></span></span></button><section className="meetup-section" aria-live="polite">{loading ? <div className="meetup-loading" role="status">Checking your meetups…</div> : meetup ? <MeetupCard meetup={meetup} onOpen={() => onOpenMeetup(meetup.id)} /> : <Image className="next-meetup-image" src="/next-meetup-reference.png" alt="Your next meetup: Pickleball with Heng and Susan tomorrow at 9:00 AM at Bishan Sports Hall. Three people going." width={1448} height={1086} priority />}</section></main>;
}
