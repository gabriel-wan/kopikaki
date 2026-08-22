# KopiKaki — Voice Call Brain

## Why

`call-screen.tsx` opens a Gemini Live session that streams audio both ways and transcribes speech — but the model has no tools and no idea who's calling. It can only chat. It never touches `/api/match`, so the hero flow from `docs/SPECIFICATIONS.md` ("Can. There are two people around Bishan... Shall I ask them?" → "Okay lor." → booked) is currently impossible over voice — you have to stop the call and tap "Find my kaki" manually. `/api/live-token` also never looks up who's calling, so "Hello Uncle David!" can't happen either.

This plan wires two deterministic tools onto the Live session, personalizes the system instruction per caller, and makes each caller's own stated availability durable — so a *later* caller's KopiKaki can actually find them. That last part is the answer to "how does person B's agent know person A said they're free 5-6pm": nothing today writes a caller's availability anywhere: `kakis`/`groups`/`activities` are static, seeded once (`scripts/seed.ts`) and never written to again. Fixing that is a backend-only change (a few lines in `/api/match`), not a new tool the model has to remember to call.

The manual text-fallback path (`hero-app.tsx`'s `preview()`/`confirm()`, `MatchScreen`) stays exactly as-is — it's the accessible path when mic/voice isn't available, and `/api/match`'s request/response JSON contract doesn't change shape, only its internal behavior does.

**Not built today** (see "Explicitly deferred" at the bottom): remembering soft preferences ("knees not so good") across calls. That's a real feature with real open questions (what's worth keeping, how it gets summarized) — separate from giving the call a brain at all, and this is a same-day build.

---

## 1. `src/lib/live-tools.ts` — new file

Pure declarative module (same spirit as `domain.ts`/`matcher.ts` — no imperative logic), so the tool schema is legible on its own and `call-screen.tsx` / `api/live-token/route.ts` share the exact same name constants (can't drift):

```ts
import { Type } from "@google/genai";

export const PROPOSE_KAKI_MATCH = "propose_kaki_match";
export const CONFIRM_KAKI_MATCH = "confirm_kaki_match";

export const LIVE_TOOLS = [{
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
```

This is the same `functionDeclarations`/`Type.OBJECT` shape already proven in `api/match/route.ts:58-73` (the existing `load_match_pool` tool) — just handed to `ai.live.connect`'s `config.tools` instead of `generateContent`'s `config.tools`. Zero new dependencies; `@google/genai` (already installed, v2.18.0) supports Live function calling natively (`LiveServerMessage.toolCall`, `Session.sendToolResponse` — confirmed in `node_modules/@google/genai/dist/web/web.d.ts`).

---

## 2. `src/lib/firebase-admin.ts` — shared profile loader

Add one function so the "fetch `users/{uid}`, parse, handle missing doc" logic exists in exactly one place (today it only lives inline in `api/match/route.ts:31-37`; this plan needs the same lookup in `api/live-token/route.ts` too):

```ts
import { parseUserProfile, type UserProfile } from "./domain";
// (add alongside existing imports)

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await adminDb.collection("users").doc(userId).get();
  if (!snapshot.exists) return null;
  try {
    return parseUserProfile(snapshot.data());
  } catch {
    return null; // malformed profile — callers decide how to degrade
  }
}
```

## 3. `src/lib/domain.ts` — extend `UserProfile` (lines 88-95)

Currently:
```ts
export type UserProfile = { name: string };
export function parseUserProfile(value: unknown): UserProfile {
  const data = objectValue(value, "User profile");
  return { name: nonEmptyString(data.preferredName ?? data.name, "User name") };
}
```
The seeded doc (`scripts/seed.ts:11`) already has `neighborhood`/`languages` — just not typed/parsed yet. Extend with the same optional-field pattern already used for `avatarUrl`/`venue`/`members` in `parseCandidate` (domain.ts:109-111):

```ts
export type UserProfile = {
  name: string;
  neighborhood?: string;
  languages?: string[];
};

export function parseUserProfile(value: unknown): UserProfile {
  const data = objectValue(value, "User profile");
  return {
    name: nonEmptyString(data.preferredName ?? data.name, "User name"),
    ...(typeof data.neighborhood === "string" && data.neighborhood.trim()
      ? { neighborhood: data.neighborhood.trim() } : {}),
    ...(Array.isArray(data.languages) && data.languages.length
      ? { languages: stringList(data.languages, "User languages", true) } : {}),
  };
}
```
Both new fields optional and tolerant of absence — only a missing/empty `name` throws, unchanged from today. `hero-app.tsx:62` (`parseUserProfile(snapshot.data()).name`) is unaffected.

## 4. `src/app/api/match/route.ts` — reuse the shared loader

Replace `requireUserName` (lines 31-37) to delegate instead of duplicating the Firestore read:
```ts
async function requireUserName(userId: string): Promise<string> {
  const profile = await loadUserProfile(userId);
  if (!profile) throw new Error("Your profile is missing. Please reseed the demo data.");
  return profile.name;
}
```
Update the import at line 13 to pull in `loadUserProfile` from `@/lib/firebase-admin`, and drop the now-unused `parseUserProfile` import from `@/lib/domain` (line 9) — nothing else in this file uses it directly anymore.

Import change (line 22): `import { excludeCaller, matchCandidates } from "@/lib/matcher";`

Replace lines 158-161:
```ts
const confirm = values.confirm === true;
const rawRequest = transcript || requestedIntent.notes || JSON.stringify(requestedIntent);
const [pool, userName] = await Promise.all([
  loadMatchPool(requestedIntent, rawRequest, !confirm),
  requireUserName(userId),
]);
await adminDb.collection("kakis").doc(userId).set({
  kind: "person",
  name: userName,
  activities: [pool.intent.activity],
  times: [pool.intent.timeOfDay],
  neighborhood: pool.intent.neighborhood,
  languages: [pool.intent.language],
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });
const people = excludeCaller(pool.people, userId);
const result = matchCandidates(pool.intent, people, pool.groups, pool.activities);
```
Then delete the now-redundant `const userName = await requireUserName(userId);` at line 185 — `userName` is already in scope from the `Promise.all` above; the confirm branch's `participantNames: [userName, ...]` usage at line 198 is unaffected.

**Key decisions:**
- **Write on every match request, not confirm-only.** The point is cold-start supply: even a caller who gets `match: null`, or who never says yes, should still become findable by the *next* caller. That only works if the write happens on preview (`confirm: false`) too. `merge: true` makes the redundant second write on confirm (same intent, since confirm reuses the stashed propose intent) harmless — just bumps `updatedAt`.
- **`requireUserName` now runs on every request, not just confirm** (one more Firestore read) — run concurrently with `loadMatchPool` via `Promise.all` so it costs no serial latency. This also means a request now hard-fails if the caller's `users/{uid}` doc is missing, even on preview (previously only confirm required it) — accepted, since the demo always has the seeded profile and the existing confirm path already had this requirement.
- **The `kakis` write is awaited, not fire-and-forget.** If it silently failed, "a second caller gets matched to the first" would inexplicably not work with no visible error during a live judged demo — worth the small latency to fail loud instead (bubbles to the existing `routeError` handler).
- No `venue` field on the upsert — already handled: the existing fallback at `route.ts:193` (`result.match.venue ?? result.match.neighborhood + " Community Club"`) covers a `person` candidate with no venue.

**Known, accepted limitations (state, don't fix today):**
- No staleness/TTL on live-upserted `kakis` docs — a stated "5-6pm" slot stays in the pool until the same caller's next call overwrites it.
- `kakis` stays readable by any authenticated user (existing `firestore.rules`, unchanged) — a live caller's stated info becomes visible pool-wide immediately, same as seeded profiles. Fine for a demo; would need a rule/collection split for anything beyond it.
- `matcher.ts`'s `compatible()` only special-cases `timeOfDay: "any"` on the *seeker's* side, not the *candidate's* — a live-upserted candidate whose own `times` is `["any"]` won't match a seeker asking for a specific time. Pre-existing asymmetry, newly reachable via live writes; out of scope to fix here.

## 5. `src/lib/matcher.ts` — self-exclusion

New standalone pure function (not a parameter on `matchCandidates`, to avoid touching that function's already-tested signature and its 6 call sites in `matcher.test.ts`):
```ts
export function excludeCaller(candidates: Candidate[], callerId: string): Candidate[] {
  return candidates.filter((candidate) => candidate.id !== callerId);
}
```

## 6. `src/lib/matcher.test.ts` — self-exclusion case

Add near the existing "far away" case (~line 68):
```ts
import { excludeCaller, matchCandidates } from "./matcher"; // update existing import (line 5)

const selfPerson = { ...person, id: "test-user" };
assert.deepEqual(excludeCaller([selfPerson, person], "test-user"), [person]);
```
Run: `npm run check:matcher` (already wired in `package.json`).

## 7. `src/app/api/live-token/route.ts` — persona personalization

Import additions: `loadUserProfile` from `@/lib/firebase-admin` (alongside the existing `requireUser` import), `type UserProfile` from `@/lib/domain`, `PROPOSE_KAKI_MATCH`/`CONFIRM_KAKI_MATCH` from `@/lib/live-tools`, and `LIVE_TOOLS` too (for the Live session's `tools` config — see step 8).

New function, above `POST`:
```ts
function buildSystemInstruction(profile: UserProfile | null): string {
  const who = profile?.name ? `for ${profile.name}` : "for a caller";
  const home = profile?.neighborhood ? `, who lives in ${profile.neighborhood}` : "";
  const speaks = profile?.languages?.length ? ` They usually speak ${profile.languages.join(", ")}.` : "";
  return (
    `You are KopiKaki, a warm concise Singapore social concierge ${who}${home}.${speaks} ` +
    "Ask what they feel like doing, when, and where. Understand Singlish and English, Mandarin, Malay, Tamil, or Hokkien. Keep replies short and guide them toward a real meetup. " +
    `When you understand their request, call ${PROPOSE_KAKI_MATCH} with a short paraphrase of it, not the raw transcript. Speak the match reason naturally, or say plainly if nothing is available yet. ` +
    `Only call ${CONFIRM_KAKI_MATCH} after they give a clear verbal yes. Once confirmed, say a short goodbye and stop talking.`
  );
}
```
In `POST`: capture `const userId = await requireUser(request);` (line 12, currently discarded), and after the `ai` null-check (line 14) add:
```ts
const profile = await loadUserProfile(userId);
const systemInstruction = buildSystemInstruction(profile);
```
Change the final response (line 28) to `NextResponse.json({ token: token.name, model: LIVE_MODEL, systemInstruction })`.

No change needed to `ai.authTokens.create`'s `liveConnectConstraints`/`lockAdditionalFields` (lines 21-22) — `lockAdditionalFields: []` already leaves `systemInstruction`/`tools` free for the client to set at connect time, exactly how the current hardcoded string already works.

## 8. `src/components/call-screen.tsx` — wire the tools

**Imports:** extend the `@google/genai` import (line 3) with `type FunctionCall`; add `import { type Candidate, type MatchIntent, type MatchTier, type Meetup } from "@/lib/domain";`; add `import { CONFIRM_KAKI_MATCH, LIVE_TOOLS, PROPOSE_KAKI_MATCH } from "@/lib/live-tools";`.

**New refs** (alongside lines 23-26):
```ts
const proposedIntentRef = useRef<MatchIntent | null>(null);
const pendingHangupRef = useRef(false);
```

**`stopVoice`** (lines 28-48): reset both new refs alongside the existing three ref resets, so a fresh call never inherits stale state from a previous session.

**New handlers** (place after `stopVoice`, before `startVoice`):
```ts
async function handlePropose(call: FunctionCall, session: Session) {
  const request = typeof call.args?.request === "string" ? call.args.request : "";
  try {
    const result = await apiPost<{
      match: Candidate | null; reason?: string; attempted: MatchTier[]; intent: MatchIntent;
    }>("/api/match", { transcript: request, confirm: false });
    proposedIntentRef.current = result.match ? result.intent : null;
    session.sendToolResponse({
      functionResponses: [{
        id: call.id, name: call.name,
        response: result.match
          ? { found: true, name: result.match.name, reason: result.reason }
          : { found: false, attempted: result.attempted },
      }],
    });
  } catch (cause) {
    proposedIntentRef.current = null;
    session.sendToolResponse({
      functionResponses: [{ id: call.id, name: call.name,
        response: { error: cause instanceof Error ? cause.message : "Could not check for a match." } }],
    });
  }
}

async function handleConfirm(call: FunctionCall, session: Session) {
  const intent = proposedIntentRef.current;
  if (!intent) {
    session.sendToolResponse({ functionResponses: [{ id: call.id, name: call.name,
      response: { error: "No proposal to confirm yet." } }] });
    return;
  }
  try {
    const result = await apiPost<{ meetup: Meetup }>("/api/match", { intent, confirm: true });
    pendingHangupRef.current = true;
    session.sendToolResponse({
      functionResponses: [{ id: call.id, name: call.name,
        response: { booked: true, title: result.meetup.title, when: result.meetup.timeLabel, venue: result.meetup.venue } }],
    });
  } catch (cause) {
    session.sendToolResponse({ functionResponses: [{ id: call.id, name: call.name,
      response: { error: cause instanceof Error ? cause.message : "Could not confirm the meetup." } }] });
  }
}
```
`session.sendToolResponse` returns `void`, not a promise — no `await` on it, only on `apiPost`. The `error` key on `response` is the SDK's documented convention for surfacing a failure to the model (`FunctionResponse.response`, `web.d.ts:4879`).

**`startVoice`** (lines 58-118): line 63 destructure becomes `const { token, model, systemInstruction } = await apiPost<{ token: string; model: string; systemInstruction: string }>("/api/live-token");`. In the `config` object (lines 73-79): replace the hardcoded `systemInstruction` string with the variable, add `tools: LIVE_TOOLS,`.

**`onmessage`** (lines 81-89): append after the existing transcript/audio handling:
```ts
const session = sessionRef.current;
if (session) {
  for (const call of message.toolCall?.functionCalls ?? []) {
    if (call.name === PROPOSE_KAKI_MATCH) void handlePropose(call, session);
    else if (call.name === CONFIRM_KAKI_MATCH) void handleConfirm(call, session);
  }
}
if (pendingHangupRef.current && message.serverContent?.turnComplete) {
  pendingHangupRef.current = false;
  void stopVoice();
}
```

**Design notes:**
- The existing `transcript` React state (line 20, shown in the fallback textarea) is left alone — tool calls use the model's own `request` paraphrase, not `transcript`. Deliberately not used as a fallback for a missing `request` arg either: the `onmessage` closure is created once inside `ai.live.connect(...)`, so it would capture a stale snapshot of `transcript`, not live updates. Falling through to `""` and letting `/api/match`'s existing short-transcript validation reject it is simpler and correct.
- Auto-hangup has no timer — it fires on the first `turnComplete` after `pendingHangupRef` is set (the goodbye turn's completion). Known limitation: the client's own `createAudioPlayer()` (`live-audio.ts:41-63`) schedules playback with its own `nextStart` queue, so there's a real chance `stopVoice()` closes the AudioContext slightly before the tail of "okay, see you tomorrow!" finishes playing. Accepted for today — do not add a compensating delay.

---

## Explicitly deferred (Phase 2, not built today)

Soft-preference/notes memory ("knees not so good so cannot walk far," "prefers small groups") isn't persisted or read back into the persona this round. Shape for later: a free-text `notes` field on `users/{uid}`, appended-to (not overwritten) when the model hears something durable, surfaced back into `buildSystemInstruction()` next call. Needs a third tool (`remember_preference(note: string)`) and a real decision on how notes get summarized/deduped over time — deliberately deferred rather than rushed.

---

## Verification

1. `npm run emulators` (background) — Firestore :8080, Auth :9099, UI :4000.
2. `npm run seed` — seeds `test-user` (David Tan / Uncle David, Bishan) + `heng`/`susan`/`raymond` kakis, one group, one activity.
3. `npm run dev:https` if testing on a phone over LAN (`getUserMedia` needs a secure context off `localhost`); confirm `GEMINI_API_KEY` is set (`.env`, see `.env.example`).
4. Open the app, grant mic permission, go to the call screen, tap "Tap to speak."
5. Say "I want kopi this afternoon in Bishan." Watch for the model to speak back a proposed match (or say plainly nothing was found), then say "yes"/"can."
6. Confirm the model says a short goodbye and the call auto-ends (status resets to "ready", mic stops) without tapping "Stop listening."
7. Firestore emulator UI (`localhost:4000/firestore`): confirm `meetups` has a new doc for `test-user` with `createdAt` set, and `kakis/test-user` exists with the spoken activity/time/neighborhood/language and a fresh `updatedAt`.
8. Confirm the app's home screen shows the new meetup automatically (existing `onSnapshot` in `hero-app.tsx`, no new wiring needed).
9. **Self-exclusion check** (only one seeded demo account exists, so this proves it behaviorally): ask for something that matches no *seeded* candidate (e.g. "chess in Yishun this evening, speaking Tamil"). First call → "nothing found" (this upserts `kakis/test-user` with those exact attributes). Call again with the same request → should *still* say "nothing found," not match you to yourself.
10. `npm run check:matcher` — should print `matcher fallback order: ok` and not throw.

### Files touched
- `src/lib/live-tools.ts` (new)
- `src/lib/firebase-admin.ts`
- `src/lib/domain.ts`
- `src/app/api/match/route.ts`
- `src/lib/matcher.ts`
- `src/lib/matcher.test.ts`
- `src/app/api/live-token/route.ts`
- `src/components/call-screen.tsx`
