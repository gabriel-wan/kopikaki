import { parseMemoryNotes, type MemoryNote } from "./memory";

export type CandidateKind = "person" | "group" | "activity";
export type MatchTier = "people" | "groups" | "activities";

export type MatchIntent = {
  activity: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "any";
  neighborhood: string;
  language: string;
  notes?: string;
};

export type Candidate = {
  id: string;
  kind: CandidateKind;
  name: string;
  activities: string[];
  times: string[];
  neighborhood: string;
  languages: string[];
  avatarUrl?: string;
  members?: string[];
  venue?: string;
};

export type MatchResult = {
  match: Candidate | null;
  attempted: MatchTier[];
  isNearby: boolean;
};

export type Meetup = {
  id: string;
  userId: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  neighborhood: string;
  status: "confirmed";
  matchedKind: CandidateKind;
  matchedId: string;
  participantNames: string[];
  reason: string;
};

const timeValues = new Set<MatchIntent["timeOfDay"]>([
  "morning",
  "afternoon",
  "evening",
  "any",
]);
const candidateKinds = new Set<CandidateKind>(["person", "group", "activity"]);

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  return value.trim();
}

function stringList(value: unknown, label: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} is invalid.`);
  }
  return value.map((item) => nonEmptyString(item, label));
}

export function parseMatchIntent(value: unknown): MatchIntent {
  const data = objectValue(value, "Intent");
  const timeOfDay = nonEmptyString(data.timeOfDay, "Time of day") as MatchIntent["timeOfDay"];
  if (!timeValues.has(timeOfDay)) throw new Error("Time of day is invalid.");
  return {
    activity: nonEmptyString(data.activity, "Activity"),
    timeOfDay,
    neighborhood: nonEmptyString(data.neighborhood, "Neighborhood"),
    language: nonEmptyString(data.language, "Language"),
    ...(typeof data.notes === "string" && data.notes.trim() ? { notes: data.notes.trim() } : {}),
  };
}

export type UserProfile = {
  name: string;
  neighborhood?: string;
  languages?: string[];
  notes?: MemoryNote[];
};

export function parseUserProfile(value: unknown): UserProfile {
  const data = objectValue(value, "User profile");
  const notes = parseMemoryNotes(data.notes);
  return {
    name: nonEmptyString(data.preferredName ?? data.name, "User name"),
    ...(typeof data.neighborhood === "string" && data.neighborhood.trim()
      ? { neighborhood: data.neighborhood.trim() } : {}),
    ...(Array.isArray(data.languages) && data.languages.length
      ? { languages: stringList(data.languages, "User languages", true) } : {}),
    ...(notes.length ? { notes } : {}),
  };
}

export function parseCandidate(id: string, value: unknown): Candidate {
  const data = objectValue(value, "Candidate");
  const kind = nonEmptyString(data.kind, "Candidate kind") as CandidateKind;
  if (!candidateKinds.has(kind)) throw new Error("Candidate kind is invalid.");
  return {
    id,
    kind,
    name: nonEmptyString(data.name, "Candidate name"),
    activities: stringList(data.activities, "Candidate activities"),
    times: stringList(data.times, "Candidate times"),
    neighborhood: nonEmptyString(data.neighborhood, "Candidate neighborhood"),
    languages: stringList(data.languages, "Candidate languages"),
    ...(typeof data.avatarUrl === "string" && data.avatarUrl.trim() ? { avatarUrl: data.avatarUrl.trim() } : {}),
    ...(data.members === undefined ? {} : { members: stringList(data.members, "Candidate members", true) }),
    ...(typeof data.venue === "string" && data.venue.trim() ? { venue: data.venue.trim() } : {}),
  };
}
