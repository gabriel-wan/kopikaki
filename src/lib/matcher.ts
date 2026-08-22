import type { Candidate, MatchIntent, MatchResult, MatchTier } from "./domain";

const normal = (value: string) => value.trim().toLocaleLowerCase();

function compatible(intent: MatchIntent, candidate: Candidate): boolean {
  const wantedActivity = normal(intent.activity);
  const wantedTime = normal(intent.timeOfDay);
  const activityFits = candidate.activities.some((item) => {
    const activity = normal(item);
    return activity.includes(wantedActivity) || wantedActivity.includes(activity);
  });
  const timeFits = wantedTime === "any" || candidate.times.map(normal).includes(wantedTime);
  const languageFits = candidate.languages.map(normal).includes(normal(intent.language));
  return activityFits && timeFits && languageFits;
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
    const match = nearby ?? candidates.find((candidate) => compatible(intent, candidate));
    if (match) return { match, attempted };
  }

  return { match: null, attempted };
}
