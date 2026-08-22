import assert from "node:assert/strict";

import type { MatchIntent } from "./domain";
import { loadMatchPoolConcurrently } from "./match-pool";

const intent: MatchIntent = {
  activity: "pickleball",
  timeOfDay: "morning",
  neighborhood: "Bishan",
  language: "English",
};

async function main() {
  let resolveIntent: ((value: { intent: MatchIntent; source: "gemini-tool" }) => void) | undefined;
  const pendingIntent = new Promise<{ intent: MatchIntent; source: "gemini-tool" }>((resolve) => {
    resolveIntent = resolve;
  });
  let candidatesStarted = false;

  const combined = loadMatchPoolConcurrently(
    () => pendingIntent,
    async () => {
      candidatesStarted = true;
      return { people: [], groups: [], activities: [] };
    },
  );

  assert.equal(
    candidatesStarted,
    true,
    "candidate loading must start without waiting for Gemini",
  );
  assert.ok(resolveIntent);
  resolveIntent({ intent, source: "gemini-tool" });
  assert.deepEqual(await combined, {
    intent,
    source: "gemini-tool",
    people: [],
    groups: [],
    activities: [],
  });

  console.log("match pool concurrency: ok");
}

void main();
