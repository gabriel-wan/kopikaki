import { CalendarDays, ChevronRight, MapPin, Users } from "lucide-react";
import type { Meetup } from "@/lib/domain";

export function MeetupCard({ meetup, onOpen }: { meetup: Meetup; onOpen: () => void }) {
  return (
    <article className="meetup-card">
      <div className="meetup-art" aria-hidden="true"><Users size={32} /></div>
      <div className="meetup-copy">
        <span className="eyebrow success-text">Confirmed</span>
        <h3>{meetup.title}</h3>
        <p><CalendarDays size={19} aria-hidden="true" />{meetup.dateLabel} · {meetup.timeLabel}</p>
        <p><MapPin size={19} aria-hidden="true" />{meetup.venue}</p>
        <div className="participant-row" aria-hidden="true">
          {meetup.participantNames.map((name) => (
            <span className="initial" key={name}>{name.split(" ").at(-1)?.[0]}</span>
          ))}
          <strong>{meetup.participantNames.length} going</strong>
        </div>
        {/* The button is the real control; ::after stretches its hit area over the whole card. */}
        <button className="card-link" onClick={onOpen}>
          See who’s going
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
