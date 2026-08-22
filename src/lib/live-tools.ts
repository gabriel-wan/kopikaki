import { Type, type ToolListUnion } from "@google/genai";

export const PROPOSE_KAKI_MATCH = "propose_kaki_match";
export const CONFIRM_KAKI_MATCH = "confirm_kaki_match";
export const UPDATE_KAKI_LIST = "update_kaki_list";
export const REMEMBER_NOTE = "remember_note";
export const FORGET_NOTE = "forget_note";
export const SET_AVAILABILITY = "set_availability";
export const FIND_AVAILABILITY = "find_availability";
export const UPDATE_PROFILE = "update_profile";
export const MY_STATUS = "get_my_status";

const dateDescription = "'today', 'tomorrow', or an exact YYYY-MM-DD date.";
const timeDescription = "24-hour HH:mm, e.g. '15:00'.";

export const LIVE_TOOLS: ToolListUnion = [{
  functionDeclarations: [
    {
      name: PROPOSE_KAKI_MATCH,
      description: "Call once you understand what the caller wants to do, when, and where. Pass your own short paraphrase, not the raw transcript. Looks up a match without booking anything. If it returns joining=true, the same thing is already arranged and the caller can join the people already going — say who is going and ask if they want to join them.",
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
      description: "Call only after the caller gives a clear verbal yes to the proposed match. Books the meetup, or adds the caller to the existing meetup they were just offered.",
      parameters: { type: Type.OBJECT, properties: {} },
    },
    {
      name: UPDATE_KAKI_LIST,
      description: "Call with add:true only after the caller gives a clear yes to adding someone as a kaki (friend). Call with add:false only when the caller explicitly asks to remove someone already on their kaki list. Never call this just because a match was proposed — only on the caller's explicit answer.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The kaki's name, as said by the caller, e.g. 'Mrs Tan'." },
          add: { type: Type.BOOLEAN, description: "true to add them as a kaki, false to remove them." },
        },
        required: ["name", "add"],
      },
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
      description: "Call when the caller asks who else is free today — for a specific activity and time, or a vague 'who's around' with no activity or time at all. Omit whatever they didn't say; never invent a value.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: dateDescription },
          activity: { type: Type.STRING, description: "e.g. 'badminton'. Omit to check any activity." },
          startTime: { type: Type.STRING, description: timeDescription + " Omit to check the whole day." },
          endTime: { type: Type.STRING, description: timeDescription + " Omit to check the whole day." },
        },
        required: ["date"],
      },
    },
    {
      name: FORGET_NOTE,
      description: "Call when the caller says something you remembered about them is no longer true or should be dropped.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "A short phrase describing what to forget, e.g. 'bad knees'." },
        },
        required: ["text"],
      },
    },
    {
      name: UPDATE_PROFILE,
      description: "Call when the caller tells you where they live or what language they'd rather speak, so it's remembered next time.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          neighborhood: { type: Type.STRING, description: "e.g. 'Bishan'." },
          languages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g. ['English', 'Mandarin']." },
        },
      },
    },
    {
      name: MY_STATUS,
      description: "Call when the caller asks what's arranged for them, or what you remember about them.",
      parameters: { type: Type.OBJECT, properties: {} },
    },
  ],
}];
