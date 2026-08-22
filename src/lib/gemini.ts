import { GoogleGenAI } from "@google/genai";

export const MATCH_MODEL = "gemini-3.6-flash";
export const LIVE_MODEL = "gemini-3.1-flash-live-preview";

export function geminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}
