import assert from "node:assert/strict";

import { matchCandidates } from "./matcher";
import type { Candidate, MatchIntent } from "./domain";

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

assert.deepEqual(matchCandidates(intent, [person], [group], [activity]), {
  match: person,
  attempted: ["people"],
});

assert.deepEqual(matchCandidates(intent, [], [group], [activity]), {
  match: group,
  attempted: ["people", "groups"],
});

assert.deepEqual(matchCandidates(intent, [], [], [activity]), {
  match: activity,
  attempted: ["people", "groups", "activities"],
});

assert.deepEqual(matchCandidates(intent, [], [], []), {
  match: null,
  attempted: ["people", "groups", "activities"],
});

console.log("matcher fallback order: ok");
