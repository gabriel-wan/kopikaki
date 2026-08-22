# KopiKaki — Product Specifications

Product-strategy notes, organized. This is the *why* behind the rules in [AGENTS.md](../AGENTS.md); AGENTS.md is the binding contract, this doc is the reasoning underneath it. Content is preserved as originally written — sections below only add headers and flag two places where the source notes cut off mid-thought (marked inline).

## 1. Positioning: the voice agent is the hero, not a feature

The app and voice experience shouldn't feel like two separate products.

Position it as: *KopiKaki is your social concierge. Call it when you want company, and it helps turn that moment into a real human meetup.* The app is the companion interface rather than the main product.

**Stop calling it an "AI companion."** This matters a lot. "AI companion for lonely seniors" can sound like *Grandma is lonely → give Grandma an AI friend* — that weakens the social-impact story. Instead: *Grandma is lonely → AI removes the friction stopping her from meeting another human.*

The AI should actually be trying to end its own conversation. That gives a fantastic principle: **the best KopiKaki conversation ends with "Okay, see you tomorrow!"**

For the Google stack: **Gemini 3.1 Flash Live Preview** for the call experience — Google's low-latency audio-to-audio model for voice-first applications, continuous real-time audio with native audio responses. **Gemini 3.6 Flash** behind the scenes for the agentic reasoning/matching/planning work.

## 2. Hero flow — the one killer workflow

Feel lonely / want to do something → call KopiKaki → describe what you want → Gemini understands → finds compatible people → coordinates → real meetup. This *is* the demo. Everything else is supporting material.

Example:

> 👴 "Hello KopiKaki."
> 🤖 "Hello Uncle David! What are you up to today?"
> 👴 "Nothing lah. At home very boring."
> 🤖 "Want to get out of the house?"
> 👴 "Maybe kopi."
> 🤖 "Can. There are two people around Bishan who are also free this afternoon. Raymond likes chess like you. Shall I ask them?"
> 👴 "Okay lor."
> 🤖 "Done. I'll let you know when they reply."

And the app lights up with the result:

> 🥞 Breakfast tomorrow
> 9:30 AM · Casuarina Curry
> Raymond · Helen · You
>
> [I'm going]

That combination — voice deciding, app confirming — is much more compelling than either surface alone.

## 3. Voice vs. app — different jobs, not duplicate ones

Don't duplicate everything in both interfaces.

- **Voice = intent and action.** Uncle talks because it's easier than navigating.
- **App = reassurance and confirmation.**

The app only needs something like:

> **HOME**
> 👋 Good morning, David
>
> ☕️ Your next meetup
> Kopi with Raymond & Helen
> Tomorrow · 9:30 AM
> 📍 Bishan
> [View meetup]
>
> 📞 Talk to KopiKaki
> [ CALL ]
>
> 👥 My Kakis
> Raymond · Helen · Mei Ling

That's basically enough — three screens made extremely swee beats twelve mediocre ones.

## 4. Matching quality bar — intelligent, not random

This is where Gemini should actually earn its place.

Don't say: *"You both selected chess."*

Say: *"Why we think you'll get along — Raymond lives two MRT stops away, prefers mornings, likes chess and hawker food, and is also looking for someone to meet casually once or twice a week."*

Gemini should also weigh softer things gathered naturally through conversation, not filled into a preference form:

- "I don't like big groups."
- "My knees not so good so cannot walk far."
- "Mandarin easier for me."
- "I usually wake up very early."
- "I recently lost my husband and just want some people to talk to."

The senior doesn't fill in 17 preference fields. They just talk. Gemini builds the useful social context underneath.

## 5. Cold-start fallback: People → Groups → Activities

The obvious judge question: *"What if there aren't other KopiKaki users nearby?"*

Don't rely exclusively on 1:1 matching. Give the agent three things it can find, in order — **People → Groups → Activities** (this is the non-negotiable fallback order enforced in [AGENTS.md](../AGENTS.md)):

- "Anyone want kopi?" could return another user.
- "Anything happening tomorrow?" could return...

*(source notes cut off here — the Groups/Activities example was never completed. The ordering itself is still the binding requirement.)*

## 6. Accessibility rationale: dialects & discoverability for seniors

A lot of tech is designed by and for younger users, and the mismatch shows. Reasons elderly people struggle with technology *(source notes list 3 of a stated 5 — captured as-is, not completed here)*:

1. **Design assumes able bodies and sharp eyes.** Small fonts, low-contrast text, tiny tap targets, and gestures like "swipe" or "long-press" assume good vision, fine motor control, and steady hands — things that often decline with age. Most interfaces aren't built with those changes in mind.
2. **It assumes prior knowledge.** Modern apps expect you to already understand concepts like accounts, passwords, "the cloud," notifications, or hamburger menus. Younger users absorbed these gradually over decades; older users are often dropped into the deep end with no on-ramp.
3. **Constant change and updates.** Just as someone learns an app's layout, an update moves everything around. For someone building new habits slowly, this "improvement" resets their progress and erodes confidence.

This is the basis for the accessibility requirements in [AGENTS.md](../AGENTS.md): large tap targets, high-contrast text, plain language, no gesture-only interactions, multi-dialect voice support.
