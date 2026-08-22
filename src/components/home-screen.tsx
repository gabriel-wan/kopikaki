import { Phone, Users } from "lucide-react";
import type { Meetup } from "@/lib/domain";
import { Brand } from "./brand";
import { MeetupCard } from "./meetup-card";

export function HomeScreen({ meetup, loading, onCall, onKakis }: { meetup: Meetup | null; loading: boolean; onCall: () => void; onKakis: () => void }) {
  return <main className="screen home-screen"><header className="topbar"><Brand /></header><section className="greeting"><p className="eyebrow">Good morning</p><h1>Uncle David!</h1><p>Let’s find someone to do something fun today.</p></section><button className="call-card" onClick={onCall}><span className="call-icon"><Phone size={35} fill="currentColor" aria-hidden="true" /></span><span><strong>Call KopiKaki</strong><small>Talk to your social concierge</small></span></button><section className="section-block" aria-live="polite"><div className="section-heading"><h2>Your Next Meetup</h2></div>{loading ? <div className="empty-card">Checking your meetups…</div> : meetup ? <MeetupCard meetup={meetup} /> : <div className="empty-card"><Users size={28} aria-hidden="true" /><strong>No meetup yet</strong><span>Call KopiKaki and we’ll find someone nearby.</span></div>}</section><button className="secondary-button" onClick={onKakis}><Users size={23} aria-hidden="true" />See My Kakis</button></main>;
}
