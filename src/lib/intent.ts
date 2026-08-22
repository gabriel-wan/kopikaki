import type { MatchIntent } from "./domain";

const activityPatterns: Array<[string, string[]]> = [
  ["pickleball", ["pickleball"]],
  ["kopi", ["kopi", "coffee", "咖啡", "minum kopi", "lim kopi", "காபி"]],
  ["chess", ["chess", "象棋", "catur"]],
  ["walk", ["walk", "散步", "jalan-jalan", "நடை"]],
  ["mahjong", ["mahjong", "麻将", "麻雀"]],
];

const neighborhoodPatterns: Array<[string, string[]]> = [
  ["Bishan", ["bishan", "碧山"]],
  ["Toa Payoh", ["toa payoh", "大巴窑"]],
  ["Ang Mo Kio", ["ang mo kio", "宏茂桥"]],
  ["Kim Keat", ["kim keat", "金吉"]],
];

function includesOne(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

export function parseIntentFallback(transcript: string): MatchIntent {
  const lower = transcript.toLocaleLowerCase();
  const activity = activityPatterns.find(([, patterns]) => includesOne(lower, patterns))?.[0] ?? "kopi";
  const neighborhood = neighborhoodPatterns.find(([, patterns]) => includesOne(lower, patterns))?.[0] ?? "Bishan";
  const timeOfDay = includesOne(lower, ["afternoon", "下午", "petang"])
    ? "afternoon"
    : includesOne(lower, ["evening", "night", "晚上", "malam"])
      ? "evening"
      : includesOne(lower, ["morning", "早上", "pagi", "காலை"])
        ? "morning"
        : "any";
  const language = includesOne(lower, ["mandarin", "华语", "中文"])
    ? "Mandarin"
    : includesOne(lower, ["malay", "melayu"])
      ? "Malay"
      : includesOne(lower, ["tamil", "தமிழ்"])
        ? "Tamil"
        : includesOne(lower, ["hokkien", "福建话", "福建話"])
          ? "Hokkien"
          : "English";

  return { activity, timeOfDay, neighborhood, language, notes: transcript };
}
