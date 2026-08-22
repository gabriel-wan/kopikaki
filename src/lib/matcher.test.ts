import assert from "node:assert/strict";

import { parseCandidate, parseMatchIntent, type Candidate, type MatchIntent } from "./domain";
import { parseIntentFallback } from "./intent";
import { matchCandidates } from "./matcher";

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
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, [], [group], [activity]), {
  match: group,
  attempted: ["people", "groups"],
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, [], [], [activity]), {
  match: activity,
  attempted: ["people", "groups", "activities"],
  isNearby: true,
});

assert.deepEqual(matchCandidates(intent, [], [], []), {
  match: null,
  attempted: ["people", "groups", "activities"],
  isNearby: false,
});

const farAwayPerson = { ...person, id: "far", neighborhood: "Tampines" };
assert.deepEqual(matchCandidates(intent, [farAwayPerson], [], []), {
  match: farAwayPerson,
  attempted: ["people"],
  isNearby: false,
});

const cartPerson = { ...person, id: "cart", activities: ["cart racing"] };
assert.equal(matchCandidates({ ...intent, activity: "art" }, [cartPerson], [], []).match, null);

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

console.log("matcher fallback order: ok");
