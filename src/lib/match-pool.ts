import type { Candidate, MatchIntent } from "./domain";

export type IntentSource = "gemini-tool" | "local";

export type UnderstoodIntent = {
  intent: MatchIntent;
  source: IntentSource;
};

export type CandidatePool = {
  meetups: Candidate[];
  people: Candidate[];
  groups: Candidate[];
  activities: Candidate[];
};

export async function loadMatchPoolConcurrently(
  understandIntent: () => Promise<UnderstoodIntent>,
  loadCandidates: () => Promise<CandidatePool>,
) {
  const [understood, candidates] = await Promise.all([
    understandIntent(),
    loadCandidates(),
  ]);
  return { ...candidates, ...understood };
}
