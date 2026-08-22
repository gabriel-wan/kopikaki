import type { Candidate, MatchIntent, MatchResult, MatchTier } from "./domain";

const normal = (value: string) => value.trim().toLocaleLowerCase();

function activityFits(wanted: string, offered: string): boolean {
  const wantedTokens = normal(wanted).match(/[\p{L}\p{N}]+/gu) ?? [];
  const offeredTokens = normal(offered).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (wantedTokens.length === 0 || offeredTokens.length === 0) return false;
  const wantedSet = new Set(wantedTokens);
  const offeredSet = new Set(offeredTokens);
  return wantedTokens.every((token) => offeredSet.has(token)) || offeredTokens.every((token) => wantedSet.has(token));
}

export function excludeCaller(candidates: Candidate[], callerId: string): Candidate[] {
  return candidates.filter((candidate) => candidate.id !== callerId);
}

function compatible(intent: MatchIntent, candidate: Candidate): boolean {
  const wantedActivity = normal(intent.activity);
  const wantedTime = normal(intent.timeOfDay);
  const activityMatches = candidate.activities.some((item) => activityFits(wantedActivity, item));
  const timeFits = wantedTime === "any" || candidate.times.map(normal).includes(wantedTime);
  const languageFits = candidate.languages.map(normal).includes(normal(intent.language));
  return activityMatches && timeFits && languageFits;
}

export function matchCandidates(
  intent: MatchIntent,
  people: Candidate[],
  groups: Candidate[],
  activities: Candidate[],
): MatchResult {
  const tiers: Array<[MatchTier, Candidate[]]> = [
    ["people", people],
    ["groups", groups],
    ["activities", activities],
  ];
  const attempted: MatchTier[] = [];

  for (const [tier, candidates] of tiers) {
    attempted.push(tier);
    const nearby = candidates.find(
      (candidate) =>
        normal(candidate.neighborhood) === normal(intent.neighborhood) && compatible(intent, candidate),
    );
    if (nearby) return { match: nearby, attempted, isNearby: true };
    const match = candidates.find((candidate) => compatible(intent, candidate));
    if (match) return { match, attempted, isNearby: false };
  }

  return { match: null, attempted, isNearby: false };
}
