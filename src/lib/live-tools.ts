import { Type, type ToolListUnion } from "@google/genai";

export const PROPOSE_KAKI_MATCH = "propose_kaki_match";
export const CONFIRM_KAKI_MATCH = "confirm_kaki_match";

export const LIVE_TOOLS: ToolListUnion = [{
  functionDeclarations: [
    {
      name: PROPOSE_KAKI_MATCH,
      description: "Call once you understand what the caller wants to do, when, and where. Pass your own short paraphrase, not the raw transcript. Looks up a match without booking anything.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          request: { type: Type.STRING, description: "Short paraphrase, e.g. 'kopi this afternoon in Bishan'." },
        },
        required: ["request"],
      },
    },
    {
      name: CONFIRM_KAKI_MATCH,
      description: "Call only after the caller gives a clear verbal yes to the proposed match. Books the meetup.",
      parameters: { type: Type.OBJECT, properties: {} },
    },
  ],
}];
