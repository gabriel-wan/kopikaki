import { GoogleGenAI } from "@google/genai";

export const MATCH_MODEL = "gemini-3.6-flash";
export const LIVE_MODEL = "gemini-3.1-flash-live-preview";

let client: GoogleGenAI | null | undefined;

export function geminiClient(): GoogleGenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return client;
}
