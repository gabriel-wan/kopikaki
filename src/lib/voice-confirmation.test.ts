import assert from "node:assert/strict";

import type { Meetup } from "./domain";
import { voiceConfirmation } from "./voice-confirmation";

const meetup: Meetup = {
  id: "m1",
  userId: "u1",
  title: "Pickleball with Uncle Heng",
  dateLabel: "Tomorrow",
  timeLabel: "9:00 AM",
  venue: "Bishan Sports Hall",
  neighborhood: "Bishan",
  status: "confirmed",
  matchedKind: "person",
  matchedId: "heng",
  participantNames: ["Gabriel", "Uncle Heng"],
  reason: "A good match.",
};

assert.deepEqual(voiceConfirmation(meetup, true), { meetup, joined: true });
assert.deepEqual(voiceConfirmation(meetup, undefined), { meetup, joined: false });

console.log("voice confirmation handoff: ok");
