export const MAX_MESSAGE_LENGTH = 500;

// Deterministic per-pair id so both sides land on the same chat doc.
export function chatId(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("_");
}

export function parseChatText(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Message must not be empty.");
  }
  const text = value.trim();
  if (text.length > MAX_MESSAGE_LENGTH) throw new Error("Message is too long.");
  return text;
}
