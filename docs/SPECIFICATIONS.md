The biggest improvement: make the voice agent the hero

The app and voice experience shouldn’t feel like two separate products.

I’d position it as:

KopiKaki is your social concierge. Call it when you want company, and it helps turn that moment into a real human meetup.

The app is then the companion interface rather than the main product.

So Uncle can say:

“KopiKaki, tomorrow morning I feel like going for breakfast.”

And KopiKaki replies:

“Can. Uncle Raymond near you is also free tomorrow morning and likes prata. Auntie Helen said she wants to meet new people too. Want me to ask them if they’re keen?”

Then the app lights up with the result:

🥞 Breakfast tomorrow
9:30 AM · Casuarina Curry
Raymond · Helen · You

[I’m going]

That combination is much more compelling than voice agent or app separately.

For the Google stack, I’d specifically use Gemini 3.1 Flash Live Preview for the call experience, since Google currently describes it as its low-latency audio-to-audio model for voice-first applications. The Live API supports continuous real-time audio and native audio responses. Then use Gemini 3.6 Flash behind the scenes for the more agentic reasoning/matching/planning work.

I’d change 7 things

1. Stop calling it an AI companion.

This matters a lot.

“AI companion for lonely seniors” can sound like:

Grandma is lonely → give grandma an AI friend.

That weakens the social-impact story.

Instead:

Grandma is lonely → AI removes the friction stopping her from meeting another human.

The AI should actually be trying to end its own conversation.

That gives you a fantastic principle:

The best KopiKaki conversation ends with “Okay, see you tomorrow!”

2. Give KopiKaki one killer workflow.

Your hero flow should be:

Feel lonely / want to do something → call KopiKaki → describe what you want → Gemini understands → finds compatible people → coordinates → real meetup.

Example:

👴 “Hello KopiKaki.”

🤖 “Hello Uncle David! What are you up to today?”

👴 “Nothing lah. At home very boring.”

🤖 “Want to get out of the house?”

👴 “Maybe kopi.”

🤖 “Can. There are two people around Bishan who are also free this afternoon. Raymond likes chess like you. Shall I ask them?”

👴 “Okay lor.”

🤖 “Done. I'll let you know when they reply.”

That is the demo.

Everything else is supporting material.

3. Give the app a completely different job from the voice agent.

Don't duplicate everything in both interfaces.

Voice = intent and action.

Uncle talks because it's easier than navigating.

App = reassurance and confirmation.

The app only needs something like:

HOME

👋 Good morning, David

☕️ Your next meetup

Kopi with Raymond & Helen
Tomorrow · 9:30 AM
📍 Bishan

[View meetup]

📞 Talk to KopiKaki

[ CALL ]

👥 My Kakis

Raymond · Helen · Mei Ling

That's basically enough.

You can make those three screens extremely swee instead of making twelve mediocre screens.

4. Make the matching feel intelligent, not random.

This is where Gemini should actually earn its place.

Don't say:

“You both selected chess.”

Say:

Why we think you'll get along

Raymond lives two MRT stops away, prefers mornings, likes chess and hawker food, and is also looking for someone to meet casually once or twice a week.

Then Gemini can consider softer things gathered naturally through conversation:

“I don't like big groups.”

“My knees not so good so cannot walk far.”

“Mandarin easier for me.”

“I usually wake up very early.”

“I recently lost my husband and just want some people to talk to.”

The senior doesn't fill in 17 preference fields.

They just talk.

Gemini builds the useful social context underneath.

5. Solve the cold-start problem in your story.

The obvious judge question is:

“What if there aren't other KopiKaki users nearby?”

Don't rely exclusively on 1:1 matching.

Give the agent three things it can find:

People → Groups → Activities

So:

“Anyone want kopi?”

could return another user.

But:

“Anything happening tomorrow?”

could return:

Kopikaki->voiceagent, dialects, discoverability for lonely elderlies

You're onto something real — a lot of tech is designed by and for younger users, and the mismatch shows. Here are 5 reasons some elderly people struggle with technology:

Design assumes able bodies and sharp eyes. Small fonts, low-contrast text, tiny tap targets, and gestures like "swipe" or "long-press" assume good vision, fine motor control, and steady hands — things that often decline with age. Most interfaces aren't built with those changes in mind.
It assumes prior knowledge. Modern apps expect you to already understand concepts like accounts, passwords, "the cloud," notifications, or hamburger menus. Younger users absorbed these gradually over decades; older users are often dropped into the deep end with no on-ramp.
Constant change and updates. Just as someone learns an app's layout, an update moves everything around. For someone building new habits slowly, this "improvement" resets their progress and erodes confidence.
