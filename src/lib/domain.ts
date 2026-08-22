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
