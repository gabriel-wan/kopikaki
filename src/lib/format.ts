import type { MatchIntent } from "./domain";

export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

export const meetupTime: Record<MatchIntent["timeOfDay"], string> = {
  any: "9:30 AM",
  morning: "9:30 AM",
  afternoon: "2:30 PM",
  evening: "6:30 PM",
};
