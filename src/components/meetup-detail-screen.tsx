import { ArrowLeft, CalendarDays, MapPin, Phone } from "lucide-react";

import type { Meetup } from "@/lib/domain";
import { formatLongDate } from "@/lib/schedule";

export function MeetupDetailScreen({
  meetup,
  currentUserName,
  onBack,
  onCall,
}: {
  meetup: Meetup;
  currentUserName: string;
  onBack: () => void;
  onCall: () => void;
}) {
  const longDate = meetup.localDate ? formatLongDate(meetup.localDate) : "";
  const you = meetup.participantNames.indexOf(currentUserName);
  return (
    <main className="screen detail-screen">
      <header className="topbar call-topbar">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft />
        </button>
        <span className="eyebrow success-text detail-status">Confirmed</span>
        <span className="icon-spacer" />
      </header>

      <div className="page-title">
        <h1>{meetup.title}</h1>
      </div>

      <section className="detail-rows">
        <p>
          <CalendarDays size={24} aria-hidden="true" />
          <span>
            <strong>{meetup.dateLabel}, {meetup.timeLabel}</strong>
            {longDate && <small>{longDate}</small>}
          </span>
        </p>
        <p>
          <MapPin size={24} aria-hidden="true" />
          <span>
            <strong>{meetup.venue}</strong>
            <small>{meetup.neighborhood}</small>
          </span>
        </p>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Who’s going</h2>
          <span className="going-chip">{meetup.participantNames.length} going</span>
        </div>
        <div className="kaki-list">
          {meetup.participantNames.map((name, index) => (
            <article className="kaki-row" key={name}>
              <span className={`avatar tone-${(index % 3) + 1}`} aria-hidden="true">
                {name.split(" ").at(-1)?.[0]}
              </span>
              <span className="kaki-info">
                <strong>{name}</strong>
                <small>{index === 0 ? "Started this meetup" : "Joined"}</small>
              </span>
              {index === you && <span className="you-chip">You</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Why KopiKaki picked this</h2>
        <p className="detail-reason">{meetup.reason}</p>
      </section>

      <div className="sticky-actions">
        <p className="detail-hint">Anyone else can join by calling KopiKaki and asking for the same thing.</p>
        <button className="secondary-button" onClick={onCall}>
          <Phone size={22} aria-hidden="true" />
          Call KopiKaki
        </button>
      </div>
    </main>
  );
}
