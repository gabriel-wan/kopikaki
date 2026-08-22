import { CalendarDays, ChevronRight, Phone } from "lucide-react";
import { useState } from "react";

import type { Meetup } from "@/lib/domain";
import { resolveSingaporeDate } from "@/lib/memory";
import { splitSchedule, type FreeWindow, type ScheduleItem } from "@/lib/schedule";
import { Brand } from "./brand";

function ScheduleCard({ item, onOpen }: { item: ScheduleItem; onOpen: () => void }) {
  return <article className={item.kind === "free" ? "schedule-card free" : "schedule-card"}><div className="date-block" aria-hidden="true">{item.block ? <><span className="date-month">{item.block.month}</span><span className="date-day">{item.block.day}</span><span className="date-weekday">{item.block.weekday}</span></> : <span className="date-soon">{item.dateText}</span>}</div><div className="schedule-copy">{item.kind === "free" && <span className="eyebrow success-text">You’re free</span>}<h3>{item.title}</h3><p>{item.timeText}{item.placeText && ` · ${item.placeText}`}</p>{item.kind === "free" && <p className="schedule-hint">KopiKaki is finding you a kaki.</p>}{item.participantNames.length > 0 && <div className="participant-row" aria-hidden="true">{item.participantNames.map((name) => <span className="initial" key={name}>{name.split(" ").at(-1)?.[0]}</span>)}<strong>{item.participantNames.length} going</strong></div>}{item.kind === "meetup" && <button className="card-link" onClick={onOpen}>See who’s going<ChevronRight size={20} aria-hidden="true" /></button>}</div></article>;
}

export function ScheduleScreen({ meetups, windows, loading, onAdd, onOpenMeetup }: { meetups: Meetup[]; windows: FreeWindow[]; loading: boolean; onAdd: () => void; onOpenMeetup: (meetupId: string) => void }) {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const { upcoming, past } = splitSchedule(meetups, windows, resolveSingaporeDate("today"));
  const items = view === "upcoming" ? upcoming : past;
  return <main className="screen"><header className="topbar"><Brand compact /><button className="add-button" onClick={onAdd}><Phone size={18} aria-hidden="true" />Add</button></header><div className="page-title"><p className="eyebrow">Your plans</p><h1>My Schedule</h1></div><div className="segmented" role="tablist" aria-label="Schedule filter">{(["upcoming", "past"] as const).map((id) => <button key={id} role="tab" aria-selected={view === id} className={view === id ? "segment active" : "segment"} onClick={() => setView(id)}>{id === "upcoming" ? "Upcoming" : "Past"}</button>)}</div><section className="schedule-list" aria-busy={loading} aria-live="polite">{loading ? <div className="empty-card">Checking your schedule…</div> : items.length === 0 ? <div className="empty-card"><CalendarDays size={28} aria-hidden="true" /><strong>{view === "upcoming" ? "Nothing planned yet" : "No past meetups yet"}</strong>{view === "upcoming" && <>Call KopiKaki and say what you feel like doing.<button className="meetup-discover-button" onClick={onAdd}>Call KopiKaki</button></>}</div> : items.map((item) => <ScheduleCard key={item.id} item={item} onOpen={() => onOpenMeetup(item.id)} />)}</section></main>;
}
