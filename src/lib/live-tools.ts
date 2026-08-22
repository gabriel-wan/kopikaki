import { Type, type ToolListUnion } from "@google/genai";

export const PROPOSE_KAKI_MATCH = "propose_kaki_match";
export const CONFIRM_KAKI_MATCH = "confirm_kaki_match";
export const REMEMBER_NOTE = "remember_note";
export const SET_AVAILABILITY = "set_availability";
export const FIND_AVAILABILITY = "find_availability";

const dateDescription = "'today', 'tomorrow', or an exact YYYY-MM-DD date.";
const timeDescription = "24-hour HH:mm, e.g. '15:00'.";

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
    {
      name: REMEMBER_NOTE,
      description: "Call when the caller shares something lasting about themselves — a preference, a physical limit, or life context. Not for one-off statements like being hungry right now. Store only what they actually said, never something you're inferring.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The fact, in the caller's own words, e.g. 'Mandarin is easier for me.'" },
          kind: {
            type: Type.STRING,
            enum: ["preference", "constraint", "context"],
            description: "preference = likes/dislikes, constraint = a physical or practical limit, context = life circumstance.",
          },
        },
        required: ["text", "kind"],
      },
    },
    {
      name: SET_AVAILABILITY,
      description: "Call when the caller states a time window they are free — or no longer free — for an activity, e.g. 'I'm free for badminton today from 3 to 4pm.'",
      parameters: {
        type: Type.OBJECT,
        properties: {
          activity: { type: Type.STRING, description: "e.g. 'badminton'." },
          date: { type: Type.STRING, description: dateDescription },
          startTime: { type: Type.STRING, description: timeDescription },
          endTime: { type: Type.STRING, description: timeDescription },
          available: { type: Type.BOOLEAN, description: "true to mark them free, false to cancel a previously stated window." },
        },
        required: ["activity", "date", "startTime", "endTime", "available"],
      },
    },
    {
      name: FIND_AVAILABILITY,
      description: "Call when the caller asks who else is free for an activity at a given time.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          activity: { type: Type.STRING, description: "e.g. 'badminton'." },
          date: { type: Type.STRING, description: dateDescription },
          startTime: { type: Type.STRING, description: timeDescription },
          endTime: { type: Type.STRING, description: timeDescription },
        },
        required: ["activity", "date", "startTime", "endTime"],
      },
    },
  ],
}];
