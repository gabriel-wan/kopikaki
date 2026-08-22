import type { Meetup } from "./domain";
import { capitalize } from "./format";

// A "free window" the caller declared over the phone (set_availability tool).
export type FreeWindow = {
  id: string;
  activity: string;
  localDate: string;
  startTime: string;
  endTime: string;
  startMinute: number;
};

export type DateBlock = { month: string; day: string; weekday: string };

export type ScheduleItem = {
  id: string;
  kind: "meetup" | "free";
  title: string;
  timeText: string;
  placeText: string;
  participantNames: string[];
  block: DateBlock | null;
  dateText: string;
  localDate: string;
  sortMinute: number;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function dateBlock(localDate: string): DateBlock | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!parts) return null;
  const [year, month, day] = parts.slice(1).map(Number);
  if (month < 1 || month > 12) return null;
  return {
    month: MONTHS[month - 1],
    day: String(day),
    weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
  };
}

export function formatLongDate(localDate: string): string {
  const block = dateBlock(localDate);
  if (!block) return "";
  return `${block.day} ${block.month[0]}${block.month.slice(1).toLowerCase()} ${localDate.slice(0, 4)}`;
}

export function formatTime12(hhmm: string): string {
  const [hour, minute] = hhmm.split(":").map(Number);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

// Sorting only — meetups store display labels like "2:30 PM", not minutes.
function labelMinute(label: string): number {
  const parts = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!parts) return 0;
  const hour = Number(parts[1]) % 12 + (parts[3].toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(parts[2]);
}

export function parseFreeWindow(id: string, value: unknown): FreeWindow | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (
    typeof data.activity !== "string" ||
    typeof data.localDate !== "string" ||
    typeof data.startTime !== "string" ||
    typeof data.endTime !== "string" ||
    typeof data.startMinute !== "number"
  ) {
    return null;
  }
  return {
    id,
    activity: data.activity,
    localDate: data.localDate,
    startTime: data.startTime,
    endTime: data.endTime,
    startMinute: data.startMinute,
  };
}

function meetupItem(meetup: Meetup, today: string): ScheduleItem {
  return {
    id: meetup.id,
    kind: "meetup",
    title: meetup.title,
    timeText: meetup.timeLabel,
    placeText: meetup.venue,
    participantNames: meetup.participantNames,
    block: meetup.localDate ? dateBlock(meetup.localDate) : null,
    dateText: meetup.dateLabel,
    // Older meetups predate localDate — keep them visible under Upcoming.
    localDate: meetup.localDate ?? today,
    sortMinute: labelMinute(meetup.timeLabel),
  };
}

function freeItem(window: FreeWindow): ScheduleItem {
  return {
    id: window.id,
    kind: "free",
    title: capitalize(window.activity),
    timeText: `${formatTime12(window.startTime)} – ${formatTime12(window.endTime)}`,
    placeText: "",
    participantNames: [],
    block: dateBlock(window.localDate),
    dateText: window.localDate,
    localDate: window.localDate,
    sortMinute: window.startMinute,
  };
}

// The home card shows the meetup that happens soonest, which is not the same as the one
// booked most recently — joining an existing meetup creates no new document.
export function nextMeetup(meetups: Meetup[], today: string): Meetup | null {
  const soonest = splitSchedule(meetups, [], today).upcoming.find((item) => item.kind === "meetup");
  return meetups.find((meetup) => meetup.id === soonest?.id) ?? null;
}

export function splitSchedule(
  meetups: Meetup[],
  windows: FreeWindow[],
  today: string,
): { upcoming: ScheduleItem[]; past: ScheduleItem[] } {
  const items = [...meetups.map((meetup) => meetupItem(meetup, today)), ...windows.map(freeItem)];
  const soonestFirst = (first: ScheduleItem, second: ScheduleItem) =>
    first.localDate.localeCompare(second.localDate) || first.sortMinute - second.sortMinute;
  return {
    upcoming: items.filter((item) => item.localDate >= today).sort(soonestFirst),
    past: items.filter((item) => item.localDate < today).sort((first, second) => soonestFirst(second, first)),
  };
}
