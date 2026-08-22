import assert from "node:assert/strict";

import {
  appendMemoryNote,
  availabilityId,
  parseMemoryOperation,
  resolveSingaporeDate,
  windowsOverlap,
  type MemoryNote,
} from "./memory";

const singaporeLateNight = new Date("2026-08-21T16:30:00.000Z");
assert.equal(resolveSingaporeDate("today", singaporeLateNight), "2026-08-22");
assert.equal(resolveSingaporeDate("tomorrow", singaporeLateNight), "2026-08-23");
assert.equal(resolveSingaporeDate("2026-09-01", singaporeLateNight), "2026-09-01");
assert.throws(() => resolveSingaporeDate("01-09-2026", singaporeLateNight), /date/i);

const setOperation = parseMemoryOperation({
  operation: "set_availability",
  args: {
    activity: "  Badminton  ",
    date: "today",
    startTime: "15:00",
    endTime: "16:00",
    available: true,
  },
}, singaporeLateNight);
assert.equal(setOperation.operation, "set_availability");
if (setOperation.operation === "set_availability") {
  assert.equal(setOperation.args.activity, "Badminton");
  assert.equal(setOperation.args.activityKey, "badminton");
  assert.equal(setOperation.args.localDate, "2026-08-22");
  assert.equal(setOperation.args.startMinute, 900);
  assert.equal(setOperation.args.endMinute, 960);
}

assert.throws(() => parseMemoryOperation({
  operation: "find_availability",
  args: { activity: "badminton", date: "today", startTime: "3pm", endTime: "16:00" },
}, singaporeLateNight), /time/i);
assert.throws(() => parseMemoryOperation({
  operation: "find_availability",
  args: { activity: "badminton", date: "today", startTime: "16:00", endTime: "15:00" },
}, singaporeLateNight), /after/i);

assert.equal(windowsOverlap(900, 960, 930, 990), true);
assert.equal(windowsOverlap(900, 960, 960, 1020), false);
assert.equal(
  availabilityId("user-1", "badminton", "2026-08-22", 900, 960),
  availabilityId("user-1", "badminton", "2026-08-22", 900, 960),
);
assert.notEqual(
  availabilityId("user-1", "badminton", "2026-08-22", 900, 960),
  availabilityId("user-2", "badminton", "2026-08-22", 900, 960),
);

const notes: MemoryNote[] = Array.from({ length: 12 }, (_, index) => ({
  text: `Fact ${index}`,
  kind: "context",
  createdAt: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
}));
const appended = appendMemoryNote(notes, {
  text: "Mandarin is easier for me",
  kind: "preference",
  createdAt: "2026-08-22T00:00:00.000Z",
});
assert.equal(appended.length, 12);
assert.equal(appended[0]?.text, "Fact 1");
assert.equal(appended[11]?.text, "Mandarin is easier for me");
assert.deepEqual(appendMemoryNote(appended, {
  text: "mandarin is easier for me",
  kind: "preference",
  createdAt: "2026-08-22T01:00:00.000Z",
}), appended);

console.log("memory helpers passed");
