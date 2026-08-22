import assert from "node:assert/strict";

import type { Meetup } from "./domain";
import {
  dateBlock,
  formatLongDate,
  formatTime12,
  nextMeetup,
  parseFreeWindow,
  splitSchedule,
} from "./schedule";

const TODAY = "2026-08-22";

function meetup(overrides: Partial<Meetup>): Meetup {
  return {
    id: "m1",
    userId: "u1",
    title: "Kopi with Heng",
    dateLabel: "Tomorrow",
    timeLabel: "2:30 PM",
    venue: "Kim Keat Café",
    neighborhood: "Toa Payoh",
    status: "confirmed",
    matchedKind: "person",
    matchedId: "k1",
    participantNames: ["Uncle David", "Heng"],
    reason: "Nearby.",
    ...overrides,
  };
}

assert.deepEqual(dateBlock("2026-05-17"), { month: "MAY", day: "17", weekday: "SUN" });
assert.equal(dateBlock("not-a-date"), null);
assert.equal(formatTime12("15:00"), "3:00 PM");
assert.equal(formatTime12("00:05"), "12:05 AM");
assert.equal(formatTime12("12:30"), "12:30 PM");

const window = parseFreeWindow("w1", {
  activity: "table tennis",
  localDate: "2026-08-23",
  startTime: "15:00",
  endTime: "16:00",
  startMinute: 900,
});
assert.ok(window);
assert.equal(parseFreeWindow("w2", { activity: "kopi" }), null);

const { upcoming, past } = splitSchedule(
  [
    meetup({ id: "past", localDate: "2026-08-20", timeLabel: "9:30 AM" }),
    meetup({ id: "later", localDate: "2026-08-23", timeLabel: "6:30 PM" }),
    meetup({ id: "legacy" }), // no localDate — stays visible under Upcoming
  ],
  [window],
  TODAY,
);
assert.deepEqual(upcoming.map((item) => item.id), ["legacy", "w1", "later"]);
assert.equal(upcoming[1].kind, "free");
assert.equal(upcoming[1].title, "Table tennis");
assert.equal(upcoming[1].timeText, "3:00 PM – 4:00 PM");
assert.deepEqual(past.map((item) => item.id), ["past"]);
assert.equal(past[0].block?.weekday, "THU");

assert.equal(formatLongDate("2026-05-17"), "17 May 2026");
assert.equal(formatLongDate("nope"), "");

// The home card follows what happens soonest, not what was booked most recently — joining
// an existing meetup adds no new document, so createdAt order would show the wrong one.
const joined = meetup({ id: "joined", localDate: "2026-08-23", timeLabel: "9:00 AM" });
const ownLater = meetup({ id: "own-later", localDate: "2026-08-30", timeLabel: "9:00 AM" });
assert.equal(nextMeetup([ownLater, joined], TODAY)?.id, "joined");
assert.equal(nextMeetup([meetup({ id: "old", localDate: "2026-08-01" })], TODAY), null);
assert.equal(nextMeetup([], TODAY), null);

console.log("schedule passed");
