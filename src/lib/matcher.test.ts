import assert from "node:assert/strict";

import {
  openMeetupCandidate,
  parseCandidate,
  parseMatchIntent,
  type Candidate,
  type MatchIntent,
  type Meetup,
} from "./domain";
import { listPeople } from "./format";
import { parseIntentFallback } from "./intent";
import { excludeCaller, matchCandidates } from "./matcher";

const pool = (over: Partial<Parameters<typeof matchCandidates>[1]> = {}) => ({
  meetups: [],
  people: [],
  groups: [],
  activities: [],
  ...over,
});

const intent: MatchIntent = {
  activity: "pickleball",
  timeOfDay: "morning",
  neighborhood: "Bishan",
  language: "English",
};

const person: Candidate = {
  id: "heng",
  kind: "person",
  name: "Uncle Heng",
  activities: ["pickleball"],
  times: ["morning"],
  neighborhood: "Bishan",
  languages: ["English", "Mandarin"],
};

const group: Candidate = {
  id: "bishan-kakis",
  kind: "group",
  name: "Bishan Active Kakis",
  activities: ["pickleball"],
  times: ["morning"],
  neighborhood: "Bishan",
  languages: ["English"],
};

const activity: Candidate = {
  id: "community-pickleball",
  kind: "activity",
  name: "Community Pickleball",
  activities: ["pickleball"],
  times: ["morning"],
  neighborhood: "Bishan",
  languages: ["English"],
};

assert.deepEqual(matchCandidates(intent, pool({ people: [person], groups: [group], activities: [activity] })), {
  match: person,
  attempted: ["meetups", "people"],
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, pool({ groups: [group], activities: [activity] })), {
  match: group,
  attempted: ["meetups", "people", "groups"],
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, pool({ activities: [activity] })), {
  match: activity,
  attempted: ["meetups", "people", "groups", "activities"],
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, pool()), {
  match: null,
  attempted: ["meetups", "people", "groups", "activities"],
  isNearby: false,
});

const farAwayPerson = { ...person, id: "far", neighborhood: "Tampines" };
assert.deepEqual(matchCandidates(intent, pool({ people: [farAwayPerson] })), {
  match: farAwayPerson,
  attempted: ["meetups", "people"],
  isNearby: false,
});

const selfPerson = { ...person, id: "test-user" };
assert.deepEqual(excludeCaller([selfPerson, person], "test-user"), [person]);

const cartPerson = { ...person, id: "cart", activities: ["cart racing"] };
assert.equal(matchCandidates({ ...intent, activity: "art" }, pool({ people: [cartPerson] })).match, null);

// Joining what is already booked beats booking a second, parallel meetup.
const bookedMeetup: Meetup = {
  id: "m1",
  userId: "heng-uid",
  title: "Pickleball with Uncle Heng",
  dateLabel: "Tomorrow",
  localDate: "2026-08-23",
  timeLabel: "9:30 AM",
  venue: "Bishan Sports Hall",
  neighborhood: "Bishan",
  status: "confirmed",
  matchedKind: "person",
  matchedId: "heng",
  participantIds: ["heng-uid"],
  participantNames: ["Uncle Heng", "Auntie Susan"],
  reason: "Nearby.",
  activity: "pickleball",
  timeOfDay: "morning",
  languages: ["English"],
};
const joinable = openMeetupCandidate(bookedMeetup);
assert.ok(joinable);
assert.equal(joinable.kind, "meetup");
assert.deepEqual(joinable.members, ["Uncle Heng", "Auntie Susan"]);

const joinResult = matchCandidates(intent, pool({ meetups: [joinable], people: [person] }));
assert.equal(joinResult.match, joinable);
assert.deepEqual(joinResult.attempted, ["meetups"]);

// A meetup for something else must not swallow the request.
assert.equal(
  matchCandidates({ ...intent, activity: "chess" }, pool({ meetups: [joinable], people: [] })).match,
  null,
);

// Legacy meetups predate the join fields and must never be offered as joinable.
assert.equal(openMeetupCandidate({ ...bookedMeetup, activity: undefined }), null);
assert.equal(openMeetupCandidate({ ...bookedMeetup, languages: [] }), null);

assert.equal(listPeople(["Uncle Heng"]), "Uncle Heng");
assert.equal(listPeople(["Uncle Heng", "Auntie Susan"]), "Uncle Heng and Auntie Susan");
assert.equal(listPeople(["A", "B", "C"]), "A, B and C");

assert.throws(
  () => parseMatchIntent({ activity: "", timeOfDay: "morning", neighborhood: "Bishan", language: "English" }),
  /activity/i,
);
assert.throws(
  () => parseCandidate("broken", { kind: "person", name: "Broken", activities: ["kopi"] }),
  /candidate/i,
);
assert.deepEqual(
  parseCandidate("heng", { ...person, id: undefined }),
  person,
);

assert.deepEqual(
  (({ activity, language, neighborhood }) => ({ activity, language, neighborhood }))(
    parseIntentFallback("明天早上我想在碧山喝咖啡，用华语"),
  ),
  { activity: "kopi", language: "Mandarin", neighborhood: "Bishan" },
);
assert.equal(parseIntentFallback("Saya mahu minum kopi, bahasa Melayu").language, "Malay");
assert.equal(parseIntentFallback("நான் காபி குடிக்க விரும்புகிறேன், தமிழ்").language, "Tamil");
assert.equal(parseIntentFallback("Lim kopi and speak Hokkien").language, "Hokkien");

console.log("matcher fallback order (meetups → people → groups → activities): ok");
