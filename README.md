<p align="center">
  <!-- TODO: replace with the real logo -->
  <img src="public/logo.png" width="160" alt="KopiKaki logo">
</p>

<h1 align="center">KopiKaki</h1>

<p align="center">
  <em>Uncle calls. KopiKaki finds a kaki. The app just confirms it.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" alt="Next.js">
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?style=flat-square" alt="Firebase">
  <img src="https://img.shields.io/badge/Gemini-3.6%20Flash-4285F4?style=flat-square" alt="Gemini">
  <img src="https://img.shields.io/badge/status-hackathon%20demo-lightgrey?style=flat-square" alt="Status">
</p>

---

Voice-first social concierge for seniors. Uncle calls (or types) what he feels like doing, Gemini understands it, matches him with a real person — falling back to a group or activity if there's no 1:1 match — and confirms a meetup. This demo is scoped to that hero flow:

**call → match (People → Groups → Activities) → confirm → Home → My Kakis**

## Run locally

**Prerequisites:** Node.js 20+, Java 21+, and a `.env` with `GEMINI_API_KEY`.

```powershell
npm install
npm run emulators
```

In a second terminal:

```powershell
npm run seed
npm run dev
```

The first terminal installs dependencies and starts local Firebase emulators (Auth/Firestore), so nothing touches the real cloud project while developing. The second seeds that local database with test data and starts the Next.js dev server.

Open `http://localhost:3000` — the browser signs in as the seeded emulator user, David Tan. Firestore Emulator UI: `http://localhost:4000`.

**On a real phone (same Wi-Fi):** run `npm run dev:https`, accept the local certificate on the phone, then open the computer's LAN address on port 3000. HTTPS is required for microphone/PWA access on mobile; emulator clients pick it up from the page hostname automatically.

## Checks

```powershell
npm run check:matcher
npm run lint
npm run typecheck
npm run build
```

`check:matcher` fails if the People → Groups → Activities fallback contract changes — it guards the one piece of logic the whole demo depends on.

## Shared demo deployment

Firebase App Hosting deploys this Next.js app from `main`. The Firebase Web App values are saved in the App Hosting backend's **Settings → Environment** page, not committed to this repo:

```text
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
```

`GEMINI_API_KEY` is a Cloud Secret Manager secret referenced by `apphosting.yaml`. Create it once with `firebase apphosting:secrets:set GEMINI_API_KEY --project kopikakis-cc6d5`, then trigger a rollout. Do not add it to App Hosting's plaintext environment form or commit it.

## Staged / dropped from v1

Real phone OTP and Firebase App Hosting need a real Firebase project on the Blaze plan — staged after the seeded hero flow works. Dropped for v1: SOS/trusted contacts, onboarding carousel, accessibility settings, notifications, profiles, activity browsing, group chat.

## Stack

Next.js (App Router, TypeScript) · Firebase (Auth, Firestore) · Gemini (Live for voice, Flash for matching) — one Google project end-to-end, deployed via Firebase App Hosting.

---

<p align="center"><sub>Built for the Gemini Hackathon — Best Elderly Hack track.</sub></p>
