import type { Meetup } from "./domain";

export type VoiceConfirmation = {
  meetup: Meetup;
  joined: boolean;
};

export function voiceConfirmation(meetup: Meetup, joined: boolean | undefined): VoiceConfirmation {
  return { meetup, joined: joined === true };
}
