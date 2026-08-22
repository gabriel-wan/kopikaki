import type { MatchIntent } from "./domain";

const activities = ["pickleball", "kopi", "coffee", "chess", "walk", "mahjong"];
const neighborhoods = ["Bishan", "Toa Payoh", "Ang Mo Kio", "Kim Keat"];

export function parseIntentFallback(transcript: string): MatchIntent {
  const lower = transcript.toLocaleLowerCase();
  const activity = activities.find((item) => lower.includes(item)) ?? "kopi";
  const neighborhood = neighborhoods.find((item) => lower.includes(item.toLocaleLowerCase())) ?? "Bishan";
  const timeOfDay = lower.includes("afternoon")
    ? "afternoon"
    : lower.includes("evening") || lower.includes("night")
      ? "evening"
      : lower.includes("morning")
        ? "morning"
        : "any";
  const language = lower.includes("mandarin") || lower.includes("华语") ? "Mandarin" : "English";
  return { activity: activity === "coffee" ? "kopi" : activity, timeOfDay, neighborhood, language, notes: transcript };
}
