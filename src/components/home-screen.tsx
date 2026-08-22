import { LogOut, Phone, Users } from "lucide-react";
import type { Meetup } from "@/lib/domain";
import { Brand } from "./brand";
import { MeetupCard } from "./meetup-card";

export function HomeScreen({ meetup, loading, onCall, onLogout, onOpenMeetup }: { meetup: Meetup | null; loading: boolean; onCall: () => void; onLogout: () => void; onOpenMeetup: (meetupId: string) => void }) {
  return <main className="screen home-screen"><header className="topbar"><Brand /><button className="logout-button" onClick={onLogout}><LogOut size={20} aria-hidden="true" />Log out</button></header><section className="greeting"><h1 className="greeting-title">Hello!</h1><p>Let’s find someone to do something fun today.</p></section><button className="call-card" onClick={onCall}><span className="call-icon"><Phone size={35} fill="currentColor" aria-hidden="true" /></span><span className="call-copy"><strong>Call KopiKaki</strong></span></button><section className="meetup-section" aria-live="polite">{loading ? <div className="meetup-loading" role="status">Checking your meetups…</div> : meetup ? <MeetupCard meetup={meetup} onOpen={() => onOpenMeetup(meetup.id)} /> : <div className="meetup-empty-state"><Users className="meetup-empty-icon" size={88} strokeWidth={1.7} aria-hidden="true" /><h2>Find a meetup near you</h2><button className="meetup-discover-button" onClick={onCall}>Find a meetup</button></div>}</section></main>;
}
