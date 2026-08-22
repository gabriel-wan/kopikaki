export const MAX_MEMORY_NOTES = 12;

export type MemoryNoteKind = "preference" | "constraint" | "context";

export type MemoryNote = {
  text: string;
  kind: MemoryNoteKind;
  createdAt: string;
};

export type RememberNoteArgs = {
  text: string;
  kind: MemoryNoteKind;
};

export type AvailabilityWindow = {
  activity: string;
  activityKey: string;
  localDate: string;
  startTime: string;
  endTime: string;
  startMinute: number;
  endMinute: number;
};

export type SetAvailabilityArgs = AvailabilityWindow & {
  available: boolean;
};

export type FindAvailabilityArgs = AvailabilityWindow;

export type MemoryOperation =
  | { operation: "remember_note"; args: RememberNoteArgs }
  | { operation: "set_availability"; args: SetAvailabilityArgs }
  | { operation: "find_availability"; args: FindAvailabilityArgs };

const noteKinds = new Set<MemoryNoteKind>(["preference", "constraint", "context"]);

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value as Record<string, unknown>;
}

function textValue(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > maxLength) throw new Error(`${label} is too long.`);
  return text;
}

function parseTime(value: unknown): { text: string; minute: number } {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error("Time must use 24-hour HH:mm format.");
  }
  const [hour, minute] = value.split(":").map(Number);
  return { text: value, minute: hour * 60 + minute };
}

function singaporeDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addUtcDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function resolveSingaporeDate(value: unknown, now = new Date()): string {
  if (typeof value !== "string") throw new Error("Date is invalid.");
  const normalized = value.trim().toLowerCase();
  const today = singaporeDate(now);
  if (normalized === "today") return today;
  if (normalized === "tomorrow") return addUtcDays(today, 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Date must be today, tomorrow, or YYYY-MM-DD.");
  }
  const [year, month, day] = normalized.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.toISOString().slice(0, 10) !== normalized) {
    throw new Error("Date is invalid.");
  }
  return normalized;
}

function parseWindow(args: Record<string, unknown>, now: Date): AvailabilityWindow {
  const activity = textValue(args.activity, "Activity", 80);
  const start = parseTime(args.startTime);
  const end = parseTime(args.endTime);
  if (end.minute <= start.minute) throw new Error("End time must be after start time.");
  return {
    activity,
    activityKey: activity.toLocaleLowerCase("en-SG"),
    localDate: resolveSingaporeDate(args.date, now),
    startTime: start.text,
    endTime: end.text,
    startMinute: start.minute,
    endMinute: end.minute,
  };
}

export function parseMemoryOperation(value: unknown, now = new Date()): MemoryOperation {
  const data = objectValue(value, "Memory request");
  const args = objectValue(data.args, "Memory arguments");
  if (data.operation === "remember_note") {
    const kind = args.kind;
    if (typeof kind !== "string" || !noteKinds.has(kind as MemoryNoteKind)) {
      throw new Error("Memory kind is invalid.");
    }
    return {
      operation: "remember_note",
      args: { text: textValue(args.text, "Memory text", 240), kind: kind as MemoryNoteKind },
    };
  }
  if (data.operation === "set_availability") {
    if (typeof args.available !== "boolean") throw new Error("Availability status is invalid.");
    return {
      operation: "set_availability",
      args: { ...parseWindow(args, now), available: args.available },
    };
  }
  if (data.operation === "find_availability") {
    return { operation: "find_availability", args: parseWindow(args, now) };
  }
  throw new Error("Memory operation is invalid.");
}

export function windowsOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export function availabilityId(
  userId: string,
  activityKey: string,
  localDate: string,
  startMinute: number,
  endMinute: number,
): string {
  const source = `${userId}|${activityKey}|${localDate}|${startMinute}|${endMinute}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)}_${(hash >>> 0).toString(36)}`;
}

export function appendMemoryNote(notes: MemoryNote[], note: MemoryNote): MemoryNote[] {
  const duplicate = notes.some((existing) =>
    existing.kind === note.kind && existing.text.toLocaleLowerCase("en-SG") === note.text.toLocaleLowerCase("en-SG"));
  if (duplicate) return notes;
  return [...notes, note].slice(-MAX_MEMORY_NOTES);
}

export function parseMemoryNotes(value: unknown): MemoryNote[] {
  if (!Array.isArray(value)) return [];
  const notes: MemoryNote[] = [];
  for (const item of value) {
    try {
      const data = objectValue(item, "Memory note");
      const kind = data.kind;
      if (typeof kind !== "string" || !noteKinds.has(kind as MemoryNoteKind)) continue;
      const createdAt = textValue(data.createdAt, "Memory timestamp", 40);
      if (Number.isNaN(Date.parse(createdAt))) continue;
      notes.push({
        text: textValue(data.text, "Memory text", 240),
        kind: kind as MemoryNoteKind,
        createdAt,
      });
    } catch {
      // Ignore malformed optional memories instead of breaking the caller's profile.
    }
  }
  return notes.slice(-MAX_MEMORY_NOTES);
}
