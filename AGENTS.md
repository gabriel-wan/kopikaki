# KopiKaki — Agent Instructions

Shared contract for any coding agent working this repo (Codex CLI, Claude Code, etc.).

## What this is

A voice-first social concierge for seniors. Uncle calls KopiKaki, says what he feels like doing, and the agent finds a compatible kaki (buddy) and coordinates a real meetup. The app is the companion surface, not the product — it confirms what the call already decided.

Guiding principle: **the AI should try to end its own conversation.** A good session ends with "okay, see you tomorrow!", not with the user still talking to the AI.

## Event context

Build with Gemini Hackathon, 22 Aug 2026, Lorong AI @ One-North. Hack 9am–3:30pm, submissions lock at 3:30pm, must be demoed live in person to qualify for finals. Track fit: **Best Elderly Hack** (primary), Most Creative Gemini Hack (secondary). Judges explicitly ruled out dashboards/health-tracker apps — don't let the app surface drift toward one.

## Hero flow — build this first, build it deepest

Call → Gemini understands the ask → matches a real person (or group/activity if no 1:1 match) → coordinates → the app's home screen lights up with a confirmed meetup card. This is the whole demo. Every mockup screen in `public/kopikaki_1.png` and `public/kopikaki_2.png` beyond this flow is supporting material — build it only after the hero flow works end-to-end, on a real phone, with a stranger's voice.

## Stack (decided, not yet scaffolded)

- Next.js (App Router, TypeScript, Tailwind), deployed as a web/PWA
- Firebase: Auth (phone OTP — seniors know phone numbers, not passwords), Firestore (users, kakis, meetups, activities), Route Handlers as the Gemini relay
- Deploy target: Firebase App Hosting — one Firebase project, `firebase deploy` ships frontend + backend + Firestore rules together. Project must be on the Blaze plan (App Hosting and phone-auth SMS both require it). See `docs/ARCHITECTURE.md` for the full deployment sequence.

Why: one Google project end-to-end, no app-store review loop between us and a judge's phone, fastest realistic path to a working demo in a single day. Swap it only for a concrete reason, not preference.

## Gemini usage

- Voice: Gemini 3.1 Flash Live Preview — native audio in/out, drives the call UI (`Listening…` / `Tap to speak` per the mockups).
- Matching/reasoning: Gemini 3.6 Flash, called server-side with function calling over Firestore data.
- **Trust boundary — never relax this:** the API key never reaches the client. Mint ephemeral tokens or relay every Gemini call through a server route.
- Matching tries **People → Groups → Activities**, in that order, before returning "nothing found." This is the cold-start fallback the product depends on (see `docs/SPECIFICATIONS.md`) — a 1:1-only matcher is an incomplete implementation, not an acceptable simplification.
- **Meetups run ahead of those three**: if a caller asks for something that is already booked, the agent offers to join the people already going instead of arranging a second parallel outing. This only adds a tier in front — it never reorders or removes People → Groups → Activities.

## Accessibility — non-negotiable, not a stretch screen

Users are seniors: large tap targets, high-contrast text, plain language, no gesture-only interactions, multi-dialect voice (English / Mandarin / Malay / Tamil / Hokkien, per the onboarding mockup). This is the product's actual differentiator, not polish — don't trade it away for speed.

## Scope discipline

Build depth-first: call flow → match → confirmation card → kaki list. SOS/trusted contacts, onboarding carousel, accessibility settings screen, and the notifications feed are stretch — stub or drop them if time runs short, and say so out loud. Never cut hero-flow robustness to fit one of these in instead.

Real phone OTP is staged, not a blocker: build and demo the hero flow against a seeded test user first, wire in real Firebase phone auth only after the hero flow works end-to-end. It buys nothing judges score, and it's real infra risk (Blaze billing, SMS delivery, reCAPTCHA) to hit on the one day it can't fail. Promote it back to required once there's time margin.

## Conventions

- TypeScript strict mode; no `any` without a comment on why.
- Server Components by default; `"use client"` only where real interactivity needs it.
- Tailwind, styled to match the mockups — don't invent a new visual language mid-build.
- Commands (once scaffolded): `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`.

## Testing bar

No test suite for a one-day build. The matching function is the exception — it's the brain of the demo: leave one runnable check that fails if it breaks (a small `*.test.ts` or an `assert`-based self-check is enough). Everything else: verify manually against the hero flow.

## Git

Small commits, branch per feature once more than one person is pushing. Before merging into `main`, review your own diff against: unhappy path handled, no race conditions, right level of abstraction, nothing downstream breaks, new behavior has a test, naming reads clearly cold, could it be simpler.

## Definition of done

The hero flow works on a real phone, over real WiFi, with a stranger's voice and a stranger's Singlish. If it only works in your own voice on your own laptop, it isn't done.
