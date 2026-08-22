import { CalendarDays, Check, MapPin, Users } from "lucide-react";

import type { Meetup } from "@/lib/domain";
import { formatLongDate } from "@/lib/schedule";

// left%, top%, colour, rotation — a still burst, so nothing distracts from the result.
const CONFETTI: Array<[number, number, string, number]> = [
  [6, 30, "#e62d24", -20], [17, 12, "#f4b32c", 35], [28, 34, "#2f7de1", 10],
  [33, 6, "#22a06b", -40], [44, 24, "#e62d24", 25], [58, 8, "#2f7de1", -15],
  [66, 30, "#f4b32c", 45], [77, 14, "#22a06b", -30], [88, 32, "#e62d24", 15],
  [94, 12, "#2f7de1", -25], [11, 52, "#22a06b", 30], [90, 54, "#f4b32c", -35],
];

export function MatchFoundScreen({
  meetup,
  joined,
  onView,
  onHome,
}: {
  meetup: Meetup;
  joined: boolean;
  onView: () => void;
  onHome: () => void;
}) {
  const longDate = meetup.localDate ? formatLongDate(meetup.localDate) : "";
  return (
    <main className="screen match-found-screen">
      <section className="celebration">
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map(([left, top, color, angle]) => (
            <span
              key={`${left}-${top}`}
              style={{ left: `${left}%`, top: `${top}%`, background: color, rotate: `${angle}deg` }}
            />
          ))}
        </div>
        <span className="success-check">
          <Check size={48} strokeWidth={3} aria-hidden="true" />
        </span>
        <h1>Match Found!</h1>
        <p>{joined ? "You’ve joined this meetup" : "Here’s your meetup"}</p>
      </section>

      <article className="confirmed-card">
        <header className="confirmed-head">
          <span className="confirmed-art" aria-hidden="true"><Users size={30} /></span>
          <h2>{meetup.title}</h2>
        </header>
        <div className="confirmed-rows">
          <p>
            <CalendarDays size={22} aria-hidden="true" />
            <span>
              <strong>{meetup.dateLabel}, {meetup.timeLabel}</strong>
              {longDate && <small>{longDate}</small>}
            </span>
          </p>
          <p>
            <MapPin size={22} aria-hidden="true" />
            <span>
              <strong>{meetup.venue}</strong>
              <small>{meetup.neighborhood}</small>
            </span>
          </p>
        </div>
        <footer className="confirmed-foot">
          <div className="participant-row" aria-hidden="true">
            {meetup.participantNames.map((name) => (
              <span className="initial" key={name}>{name.split(" ").at(-1)?.[0]}</span>
            ))}
          </div>
          <span className="going-chip">{meetup.participantNames.length} going</span>
        </footer>
      </article>

      <div className="sticky-actions">
        <button className="primary-button" onClick={onView}>View meetup</button>
        <button className="secondary-button" onClick={onHome}>Back to home</button>
      </div>
    </main>
  );
}
