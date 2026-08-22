# KopiKaki v1

Voice-first social concierge for seniors. This demo is deliberately limited to the hero flow: call or type a request, understand it with Gemini, match People → Groups → Activities, confirm a meetup, see it appear on Home, then view My Kakis.

## Run locally

Prerequisites: Node.js 20+, Java 21+, and `.env` containing `GEMINI_API_KEY`.

```powershell
npm install
npm run emulators
```

In a second terminal:

```powershell
npm run seed
npm run dev
```

Summarised: The first terminal installs the project's dependencies, then starts local fake versions of Firebase (Auth/Firestore) on your machine so you're not touching the real cloud project while developing; the second terminal fills that local fake database with test data (seed) and then starts the Next.js dev server so you can open the app in your browser and try it against that seeded data.

Open `http://localhost:3000`. The browser signs in as the seeded Firebase Auth emulator user, David Tan. Firestore Emulator UI is at `http://localhost:4000`.

For a real phone on the same Wi-Fi, run `npm run dev:https`, accept the local certificate on the phone, and open the computer’s LAN address on port 3000. HTTPS is required by mobile browsers for microphone and PWA features. Emulator clients use the page hostname automatically.

## Checks

```powershell
npm run check:matcher
npm run lint
npm run typecheck
npm run build
```

The matcher check fails if the People → Groups → Activities fallback contract changes.

## Staged work

Real phone OTP and Firebase App Hosting require a real Firebase project on the Blaze plan. They are intentionally staged after the seeded hero flow. Also dropped from v1: SOS/trusted contacts, onboarding carousel, accessibility settings, notifications, profiles, activity browsing, and group chat.
