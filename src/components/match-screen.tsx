import { ArrowLeft, Check, MapPin, Users } from "lucide-react";

import type { Candidate, MatchIntent, MatchTier, Meetup } from "@/lib/domain";
import { capitalize } from "@/lib/format";

export function MatchScreen({
  candidate,
  reason,
  intent,
  attempted,
  busy,
  error,
  onBack,
  onConfirm,
}: {
  candidate: Candidate;
  reason: string;
  intent: MatchIntent;
  attempted: MatchTier[];
  busy: boolean;
  error: string;
  onBack: () => void;
  onConfirm: () => Promise<Meetup | void>;
}) {
  // A meetup match means someone has already booked this — the caller joins it rather
  // than starting a second one.
  const joining = candidate.kind === "meetup";
  const going = candidate.members?.length ?? 0;
  return (
    <main className="screen match-screen">
      <header className="topbar">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft />
        </button>
      </header>
      <section className="success-heading">
        <span className="proposal-check">
          <Users size={40} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1>{joining ? "This is already happening" : "I found a kaki"}</h1>
        <p>{joining ? "Would you like to join them?" : "Here’s someone who can join you."}</p>
      </section>
      <article className="proposal-card">
        <div className="proposal-banner">
          <Users size={38} aria-hidden="true" />
          <div>
            <span className="eyebrow">{joining ? "Meetup" : candidate.kind}</span>
            <h2>{candidate.name}</h2>
          </div>
        </div>
        <div className="proposal-details">
          <p><strong>{capitalize(intent.activity)}</strong></p>
          <p><MapPin size={21} aria-hidden="true" />{candidate.venue ?? candidate.neighborhood}</p>
          {joining && going > 0 && (
            <div className="participant-row" aria-label={`${going} people going`}>
              {candidate.members?.map((name) => (
                <span className="initial" key={name}>{name.split(" ").at(-1)?.[0]}</span>
              ))}
              <strong>{going} going</strong>
            </div>
          )}
          <p className="reason">{reason}</p>
          <p className="reason">Checked: {attempted.map(capitalize).join(" → ")}</p>
        </div>
      </article>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="sticky-actions">
        <button className="primary-button" onClick={onConfirm} disabled={busy}>
          <Check size={24} aria-hidden="true" />
          {busy ? (joining ? "Joining…" : "Confirming…") : joining ? "Yes, join them" : "Yes, confirm meetup"}
        </button>
        <button className="secondary-button" onClick={onBack} disabled={busy}>
          Try another request
        </button>
      </div>
    </main>
  );
}
