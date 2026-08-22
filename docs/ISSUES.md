# Known Issues

Baseline review before first push to the team. Ranked by severity — fix the top tier before the next demo run, the rest is backlog.

## Critical — breaks the hero flow

- [ ] **Voice persona & live transcript never apply** — [src/app/api/live-token/route.ts:20](../src/app/api/live-token/route.ts#L20) mints the ephemeral Live token with only `responseModalities` set and no `lockAdditionalFields`. Per Gemini Live's documented contract, omitting it locks the session to exactly the fields on the token — so `call-screen.tsx`'s `systemInstruction` (the KopiKaki persona) and `inputAudioTranscription`/`outputAudioTranscription` get silently dropped at connect time. No error, the persona just never applies and transcripts never populate. Fix: set `lockAdditionalFields: []` or list every field the client passes at connect time.
- [ ] **Confirmation screen crashes on empty activity** — [src/app/api/match/route.ts:33](../src/app/api/match/route.ts#L33) validates Gemini's tool-call args with `typeof === "string"` only, not non-empty. An empty `activity: ""` passes validation, then `matcher.ts`'s substring check (`"".includes()`) treats it as compatible with every candidate, and `match-screen.tsx:5`'s `intent.activity[0].toLocaleUpperCase()` throws on `undefined`. Fix: reject empty strings in the arg check.
- [ ] **"Is nearby" can be false** — [src/lib/matcher.ts:30-36](../src/lib/matcher.ts#L30-L36) falls back to a neighborhood-agnostic match when no local candidate fits (`compatible()` never checks neighborhood at all), but [src/app/api/match/route.ts:62](../src/app/api/match/route.ts#L62) unconditionally builds the reason text as "`{name} is nearby, ...`". A senior can be told their meetup partner is nearby when they're on the other side of Singapore. Fix: have `matchCandidates` report whether the match was neighborhood-scoped and vary the reason text.
- [ ] **Home can show a stale meetup** — [src/components/hero-app.tsx:34](../src/components/hero-app.tsx#L34) queries `meetups` with no `orderBy`; line 36 picks `.at(-1)` assuming snapshot order equals creation order, which Firestore doesn't guarantee. Fix: `orderBy("createdAt", "desc")` + `.at(0)`.

## Deploy-breaking

- [ ] **Client Firebase SDK always points at emulator ports** — [src/lib/firebase-client.ts:11](../src/lib/firebase-client.ts#L11) `connectLocalFirebase()` has no `NODE_ENV`/production guard, unlike `firebase-admin.ts` which correctly branches. Deploying to Firebase App Hosting as-is breaks every Auth/Firestore call in production (browser tries to reach emulator ports on the prod hostname).

## Security

- [ ] **Firestore rules grant blanket read access** — [firestore.rules:5](../firestore.rules#L5) `allow read: if request.auth != null` has no per-user ownership check; any signed-in user can read every document in every collection, including other users' `meetups`. The app's `where("userId","==",uid)` filtering is client-side convenience, not an access boundary. Invisible with one seeded user, real the moment real phone-auth adds a second account.

## Resource leaks / correctness (voice call lifecycle)

All in `src/components/call-screen.tsx`:
- [ ] `stopVoice()` doesn't null `closePlayerRef.current` after use — stop-then-type calls it twice, the second `AudioContext.close()` rejects and silently kills the text-fallback submit (the accessibility-required path).
- [ ] `startVoice()`'s catch block never closes the session/AudioContext it already opened if `streamMicrophone` fails after `connect()` succeeds — leaks on every failed retry (denied mic permission, flaky network).
- [ ] No `useEffect` cleanup at all — navigating away mid-call via bottom nav leaves the mic, AudioContext, and Gemini Live session running indefinitely.

- [ ] **Firestore listener cleanup race** — [src/components/hero-app.tsx:29-42](../src/components/hero-app.tsx#L29-L42), the effect's cleanup can fire before the async sign-in resolves (React Strict Mode dev double-invoke), leaking the real `onSnapshot` listeners created afterward.
- [ ] **Unchecked Firestore doc cast** — [src/app/api/match/route.ts:15](../src/app/api/match/route.ts#L15) casts docs `as Candidate` with no validation; a document missing `times`/`activities`/`languages` throws inside `matcher.ts`, then gets misreported as a generic 401 "please sign in again."

## Cleanup — dead code / duplication

- [ ] **`/api/intent` route is dead code** — [src/app/api/intent/route.ts](../src/app/api/intent/route.ts) has zero callers; both voice and text paths POST straight to `/api/match`, which has its own separate, divergent intent-understanding prompt inline. Delete the route or wire it in — not both.
- [ ] Capitalize-first-letter logic duplicated verbatim — [src/app/api/match/route.ts:69](../src/app/api/match/route.ts#L69) and [src/components/match-screen.tsx:5](../src/components/match-screen.tsx#L5). Extract one `capitalize()` helper.
- [ ] `timeLabel` nested ternary — [src/app/api/match/route.ts:71](../src/app/api/match/route.ts#L71), `"any"` and `"morning"` both hardcode `"9:30 AM"` separately. Replace with a `Record<TimeOfDay, string>` lookup.
- [ ] Emulator bootstrap duplicated three times — `src/lib/firebase-admin.ts`, `scripts/seed.ts`, and `src/lib/firebase-client.ts` each hardcode ports 8080/9099 independently. `seed.ts` could import `adminAuth`/`adminDb` instead of re-initializing.
- [ ] `intent` and `proposal` state always set/read together — [src/components/hero-app.tsx:17-18](../src/components/hero-app.tsx#L17-L18). Fold `intent` into the `Proposal` type, drop the extra `useState`.
- [ ] Every API route's catch-all hardcodes HTTP 401 regardless of cause — [src/app/api/match/route.ts:83](../src/app/api/match/route.ts#L83), duplicated in the `intent` and `live-token` routes. A Firestore hiccup mid-demo would misleadingly say "please sign in again." One shared error helper fixes all three.
- [ ] `proposal.attempted` is captured but never rendered — [src/components/hero-app.tsx:13](../src/components/hero-app.tsx#L13), dead state (which People→Groups→Activities tier matched is never shown to the user).

## Worth knowing, not urgent

- `matcher.ts`'s tier selection is first-`.find()`-wins, not scored — fine at hackathon seed-data scale, becomes a real gap once a tier has multiple compatible candidates.
- Offline/no-Gemini fallback ([src/lib/intent.ts:17](../src/lib/intent.ts#L17)) only detects English/Mandarin, not Malay/Tamil/Hokkien — only matters if a demo runs with `GEMINI_API_KEY` unset, but AGENTS.md calls multi-dialect non-negotiable.
- Bidirectional substring activity matching ([src/lib/matcher.ts:8-11](../src/lib/matcher.ts#L8-L11)) can false-positive on unrelated activities sharing a substring (e.g. "art" vs "cart") once activity vocabulary grows beyond the seed list.
- `loadMatchPool` fetches kakis/groups/activities sequentially instead of via `Promise.all` ([src/app/api/match/route.ts:42-44](../src/app/api/match/route.ts#L42-L44)) — 3x avoidable Firestore latency per match call.
- `geminiClient()` constructs a new SDK client on every request instead of caching a singleton (`src/lib/gemini.ts`).
