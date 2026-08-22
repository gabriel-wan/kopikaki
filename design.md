# KopiKaki — Design System and Product UI

> Status: approved design direction; not yet implemented in the application.
>
> Product principle: KopiKaki should help an older adult arrange a real meetup, then end the AI conversation. The app confirms and supports the plan; it is not the main product.

## 1. Authority and scope

This document is the design source of truth for KopiKaki's mobile-first web/PWA interface. When guidance conflicts, use this order:

1. The user flow and accessibility requirements in `AGENTS.md`.
2. This document.
3. The existing KopiKaki implementation and mockups.
4. External design references.

The Canopy design document was reviewed only for reusable principles: semantic tokens, restrained color, consistent typography roles, predictable spacing, visible focus, and subtle motion. Its fonts, technical tone, dashed rails, dot grids, glassmorphism, highlighter effects, and dark-mode-first structure are not KopiKaki requirements and must not be copied as product truth.

The approved direction is **Warm Utility**: friendly red-and-white branding, warm neutral surfaces, large controls, plain language, and one obvious next action per screen.

## 2. Product and audience

KopiKaki is a voice-first social concierge for older adults. A user says what they would like to do, Gemini finds a compatible person, group, or activity, coordinates the plan, and the app displays the confirmed meetup.

Design for:

- reduced visual acuity and contrast sensitivity;
- reduced fine-motor precision;
- unfamiliarity with hidden gestures and technical language;
- multilingual speech and text;
- interrupted or unreliable microphone and network access;
- a user who wants confidence that a real social plan has been made.

Do not make the interface look like a health tracker, analytics dashboard, or productivity application. Do not describe KopiKaki as a replacement friend or "AI companion." It connects people to people.

## 3. Core experience

The hero flow is:

**Home → Call KopiKaki → describe the request → People → Groups → Activities matching → review proposal → confirm → Home displays the confirmed meetup.**

The AI should seek the minimum conversation needed to make a trustworthy plan. A successful session ends with a clear confirmation such as "All set. See you tomorrow!"

### Top-level navigation

Use four persistent, labeled destinations:

1. **Home**
2. **My Kakis**
3. **My Activities**
4. **Profile**

Do not add Call or Meetups as additional navigation tabs:

- Call KopiKaki is the dominant action on Home.
- Upcoming meetups live on Home and under My Activities.
- Four items leave enough width for large tap areas and readable labels.

The bottom navigation is visible on top-level screens. Hide it during focused flows—voice calls, proposal review, confirmation, chat, and detail screens—and provide a large, labeled Back or End call control.

## 4. Visual language

### 4.1 Typography

Use one interface family across headings, body copy, labels, forms, and buttons:

```css
--font-ui: "Noto Sans", "Noto Sans SC", "Noto Sans Tamil", Arial, sans-serif;
--font-brand: Georgia, "Times New Roman", serif;
```

Noto Sans is selected for clear letterforms and multilingual coverage. Load only the weights and scripts the product actually uses. The existing serif KopiKaki wordmark is the sole controlled exception; it is a brand treatment, not a general heading font.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `text-display` | 40 / 44px | 700 | Rare hero statement |
| `text-page-title` | 32 / 38px | 700 | Page title and call state |
| `text-section` | 24 / 30px | 700 | Major section heading |
| `text-card-title` | 20 / 26px | 700 | Meetup, kaki, and activity title |
| `text-body` | 18 / 28px | 400 | Default content |
| `text-body-strong` | 18 / 28px | 700 | Important content and buttons |
| `text-supporting` | 16 / 24px | 400–600 | Metadata and navigation labels |

Rules:

- Never use interface body text smaller than 16px.
- Use sentence case. Avoid long all-caps eyebrow labels.
- Prefer wrapping over truncation.
- Keep paragraphs to roughly 35–60 characters per line on phones.
- Support browser zoom and text scaling to 200% without hiding content or actions.

### 4.2 Color

Red and white remain the brand identity. Warm neutrals create separation without adding a competing visual theme. Functional colors are allowed only when they communicate a state and are always paired with text or an icon.

| Token | Value | Use |
| --- | --- | --- |
| `color-brand` | `#E62D24` | Brand mark, illustration, large decorative accent |
| `color-action` | `#B91F19` | Primary buttons and selected navigation |
| `color-action-pressed` | `#8E1713` | Pressed primary action |
| `color-brand-soft` | `#FDE8E6` | Selected or supportive red surface |
| `color-canvas` | `#FFF8F4` | Page background |
| `color-surface` | `#FFFFFF` | Cards, inputs, navigation |
| `color-text` | `#1F1A17` | Primary text |
| `color-text-secondary` | `#5B514C` | Supporting text |
| `color-border` | `#D8CEC7` | Card and control boundaries |
| `color-success` | `#16794A` | Confirmed state with icon/text |
| `color-focus` | `#145CCA` | Keyboard and assistive focus ring |
| `color-error` | `#9F1D17` | Error text and border with recovery message |

`color-brand` does not provide enough contrast for normal-size white button text. Use `color-action` wherever white text appears on red. Core text should target a 7:1 contrast ratio where practical and must never fall below WCAG AA.

Do not use:

- red and green as the only distinction between states;
- pale gray text on white;
- translucent glass surfaces;
- decorative rainbow gradients;
- raw color values inside individual components when a semantic token exists.

### 4.3 Spacing and layout

Use a 4/8px rhythm:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

- Phone gutter: 20px; increase to 24px on wider phones.
- Related control gap: at least 12px.
- Card internal padding: 20–24px.
- Section spacing: 24–32px.
- Major flow break: 40–48px.
- Use a single-column layout on phones.
- Center the application at a readable maximum width on tablets and desktop; do not stretch cards edge to edge.
- Respect top, bottom, notch, and gesture safe areas.
- Reserve space for the fixed navigation so it never obscures content.

### 4.4 Shape and elevation

- Controls: 14–16px radius.
- Cards: 18–20px radius.
- Circular shapes: avatars, the voice control, and small status marks only.
- Prefer visible borders over shadow-only boundaries.
- Use one restrained card shadow; do not stack heavy elevations.
- Avoid glassmorphism, background blur as decoration, dashed rails, and dot grids.

### 4.5 Iconography

Retain the current KopiKaki coffee mark, app icon, and Lucide icon family.

| Role | Visible size | Minimum tap area |
| --- | --- | --- |
| Navigation icon | 24px | 56 × 56px |
| Content icon | 28px | 56 × 56px when interactive |
| Hero icon | 36px | Included within a 64px+ control |

- Use a consistent 2–2.5px stroke weight within each visual layer.
- Pair navigation and action icons with visible labels.
- Do not introduce emoji as structural icons.
- Decorative icons are hidden from assistive technology; meaningful icons receive accessible names.

### 4.6 Motion

- Use motion to explain state changes, not to decorate the screen.
- Tap feedback should begin within 100ms.
- Keep transitions between 150 and 250ms.
- The listening animation may gently breathe, but must not flash or rapidly pulse.
- Under `prefers-reduced-motion`, replace animation with a static icon and explicit status label.
- Never block interaction while an animation completes.

## 5. Interaction hierarchy

Every screen has one dominant action.

### Primary action

- Solid `color-action` surface with white text.
- Minimum height: 64px for hero and flow-confirmation actions; 56px elsewhere.
- Full width on phone when it advances the main flow.
- Use a verb-first label: "Call KopiKaki," "Find a new kaki," or "Confirm meetup."

### Secondary action

- White surface, dark text, and a visible border.
- Minimum height: 56px.
- Used for actions such as "Try another" and "Prefer to type."

### Tertiary action

- Text label with a large transparent tap area.
- Never use a tiny unlabeled icon for a required action.

### Disabled and busy states

- Preserve the button label and add progress wording, for example "Finding a kaki…"
- Disable repeat submission while work is in progress.
- Do not communicate disabled state through opacity alone.

## 6. Screen specifications

### 6.1 Home

Hierarchy:

1. KopiKaki brand and friendly greeting.
2. Large **Call KopiKaki** action card.
3. **Your next meetup** card or actionable empty state.
4. Bottom navigation.

The Call card is at least 96px tall and contains the current phone/coffee visual, the label "Call KopiKaki," and supporting copy such as "Tell me what you feel like doing."

The meetup card shows:

- confirmed status;
- activity title;
- date and time;
- venue;
- participant names or count;
- a visible "View meetup" action when details exist.

Remove Log out from the Home header and place it in Profile. Remove the duplicate "See My Kakis" button because My Kakis already has a navigation destination.

### 6.2 Call KopiKaki

This is a focused full-screen flow. Hide bottom navigation and keep a large Back or End call action visible.

Supported states:

1. **Ready:** "What do you feel like doing?" and "Tap to speak."
2. **Connecting:** "Starting the call…"
3. **Listening:** "I'm listening…" with a visible Stop listening control.
4. **Thinking:** "Finding a kaki…"
5. **Proposal:** show the candidate and plan.
6. **Confirming:** preserve proposal details while confirmation runs.
7. **Confirmed:** "All set. See you tomorrow!"

Typing remains available through a visible "Prefer to type?" secondary action. Once opened, the text field has a persistent label, example request, and a large "Find my kaki" button.

Do not display a long raw transcript by default. Show only the current understood request and allow the user to correct it.

### 6.3 Proposal and confirmation

Before confirmation, show all information needed for trust:

- who the user will meet;
- what they will do;
- date and time;
- venue;
- why the match fits;
- whether the result is a person, group, or activity.

Use "We found a kaki" rather than technical matching language. Do not expose implementation details such as the full fallback trace in the primary interface. That information may remain in development diagnostics.

Actions:

- Primary: **Confirm meetup**
- Secondary: **Try another**
- Tertiary: **Back**

After successful confirmation, return to Home and announce that the next-meetup card has updated. The user should not need to reload or repeat the call.

### 6.4 My Kakis

Hierarchy:

1. Page title and plain-language description.
2. Primary **Find a new kaki** action.
3. Secondary **Ask KopiKaki** action.
4. Existing kakis in a vertical list.

Each kaki row includes:

- photo or existing avatar treatment;
- name;
- one or two shared interests;
- general area, not unnecessary precise location;
- a visible affordance to open the profile.

The kaki detail page includes a large "Chat with [name]" action. Chat is a focused screen with a large text input, optional voice input, readable message grouping, and a clear Back action.

"Ask KopiKaki" opens the same conversational agent with My Kakis context. Do not invent a separate bot personality or second assistant interface.

Empty state: "You haven't met any kakis yet" with the action "Find my first kaki."

### 6.5 My Activities

Use two large segmented views:

- **Upcoming** — confirmed meetups in chronological order.
- **Explore** — available groups and activities.

Activity cards show the title, date, time, venue, available places or attendee count, and a visible detail action. Use a vertical list by default; avoid dense image grids and long rows of tiny filter chips.

The dominant action is "Ask KopiKaki to plan something." Manual activity creation, complex filtering, and calendar management are later-stage features and must not delay the hero flow.

Empty states always include a recovery action:

- Upcoming: "No plans yet" → "Call KopiKaki."
- Explore: "Nothing nearby right now" → "Try another area" or "Ask KopiKaki."

### 6.6 Profile

Profile stores and explains the information KopiKaki uses to make better matches:

- name and photo;
- spoken languages;
- interests;
- preferred days and times;
- preferred general locations;
- accessibility preferences;
- past meetups as a simple history list.

Settings include text size, contrast preference, read-aloud preference, language, help, privacy, and Log out. Log out is visually separated from normal settings.

Do not add health data, streaks, engagement scores, charts, or productivity metrics. "Track stuff" means reviewing meetup history and personal preferences, not introducing a dashboard.

## 7. Shared component contract

The interface should be composed from a small set of consistent primitives:

- `AppShell` — width, background, safe areas, and content insets.
- `TopBar` — brand, page title, and labeled Back/End action.
- `BottomNav` — four top-level labeled destinations.
- `Button` — primary, secondary, and tertiary variants with shared size/state rules.
- `PrimaryActionCard` — Home's Call KopiKaki action.
- `Card` — bordered white surface for meetup, kaki, activity, and settings content.
- `MeetupCard` — confirmed plan summary.
- `KakiListItem` — avatar, identity, shared context, and open action.
- `ActivityCard` — activity logistics and detail action.
- `SegmentedControl` — large Upcoming/Explore selection.
- `VoiceState` — explicit ready/listening/thinking state and controls.
- `StatusMessage` — loading, success, warning, and error feedback.
- `EmptyState` — plain explanation plus one next action.
- `FormField` — persistent label, helper text, validation, and accessible error.

Components consume semantic design tokens; page components must not invent independent font sizes, colors, radii, button heights, or shadows.

### Data and state flow

1. Home launches the single Call KopiKaki experience.
2. Voice or typed input becomes one editable, plain-language request.
3. The server-side matching flow checks People → Groups → Activities and returns a proposal without creating a meetup.
4. The proposal screen presents the complete plan and waits for explicit confirmation.
5. Confirmation creates the meetup exactly once and reports progress without discarding the proposal.
6. The existing real-time meetup listener updates Home with the confirmed card.

The interface must preserve the understood request, proposal, and recovery context across recoverable errors. My Kakis, My Activities, and Profile must use the existing account and Firestore records rather than introducing parallel client-only sources of truth.

## 8. Feedback, errors, and recovery

Feedback must explain what happened and what the user can do next.

| Situation | Message behavior | Recovery action |
| --- | --- | --- |
| Microphone permission denied | Explain that microphone access is off | "Try microphone again" and "Type instead" |
| Voice interrupted | Preserve the understood request | "Continue speaking" and "Type instead" |
| Request unclear | Repeat the part understood in plain language | "Say it another way" |
| No match | State that people, groups, and activities were checked | "Change my request" |
| Confirmation failed | Keep the proposed meetup visible | "Try confirming again" |
| Offline | State that KopiKaki needs a connection to arrange a meetup | "Try again" |
| Empty list | Explain why the screen is empty | One relevant primary action |

Rules:

- Place errors next to the affected control or content.
- Keep global alerts for cross-screen failures only.
- Never show raw Firebase, browser, or Gemini error strings to the user.
- Announce asynchronous status changes through an appropriate live region without stealing focus.
- After an error, focus the message or first recovery action.

## 9. Accessibility requirements

These requirements are part of the product, not an optional settings screen:

- Minimum interactive target: 56 × 56px for primary controls and icon buttons.
- Minimum 12px separation between adjacent touch targets.
- Visible 3–4px focus ring with offset.
- Sequential heading hierarchy and semantic landmarks.
- Keyboard operation for every control.
- Screen-reader names, states, and logical reading order.
- Browser zoom and text scaling to 200%.
- No disabled zoom in viewport configuration.
- No gesture-only, hover-only, or color-only action.
- Reduced-motion behavior for all animation.
- Layout support for small phones, large phones, tablets, and landscape.
- Plain-language labels; avoid unexplained technical terms.
- Multi-dialect voice support for English, Mandarin, Malay, Tamil, and Hokkien.
- Preserve the typed request and proposal when recovering from errors or accidental navigation.

Accessibility preferences can enhance these defaults but must never be required to make the base experience usable.

## 10. Responsive behavior

- **320–389px:** 20px gutters, single column, wrapped labels, no horizontal scroll.
- **390–767px:** 24px gutters where space allows; same information hierarchy.
- **768px and above:** center the phone-oriented experience in a readable container; increase surrounding whitespace rather than information density.
- **Landscape:** preserve all actions, allow vertical scrolling, and avoid placing fixed controls over content.

The bottom navigation remains reachable without covering the last card. Dialogs and sheets must fit within the viewport at 200% zoom and provide an explicit close control.

## 11. Content guidelines

- Use **KopiKaki** consistently.
- Address the user by their chosen name; do not hardcode "Uncle" or "Auntie."
- Prefer "meetup" to "appointment" for social plans.
- Prefer "Call KopiKaki" to "Start AI session."
- Prefer "We found a kaki" to "Match algorithm completed."
- Prefer "Try again" plus a reason to generic "Something went wrong."
- Keep one idea per sentence and one decision per screen.
- Do not over-explain Gemini or expose model names in the customer interface.

## 12. Implementation priorities

Depth comes before breadth.

### Priority 0 — hero flow

1. Introduce semantic typography, color, spacing, radius, and motion tokens.
2. Apply Noto Sans interface typography and the approved type scale.
3. Standardize button sizes, focus states, card hierarchy, and accessible contrast.
4. Keep Call KopiKaki as the dominant Home action.
5. Refine the voice states, text fallback, proposal details, confirmation recovery, and Home meetup update.
6. Test with a real phone, real Wi-Fi, a stranger's voice, and Singlish.

### Priority 1 — approved navigation

1. Replace the current Home / Call / My Kakis bottom navigation with Home / My Kakis / My Activities / Profile.
2. Launch Call from Home rather than a navigation tab.
3. Hide navigation during focused task flows.
4. Move Log out to Profile and remove the duplicate My Kakis Home button.

### Priority 2 — supporting destinations

1. Expand My Kakis with Find a new kaki, Ask KopiKaki, details, and chat entry points.
2. Add My Activities with Upcoming and Explore.
3. Add Profile with matching preferences, meetup history, accessibility preferences, help, privacy, and Log out.

Supporting destinations may begin with honest empty states, but must not weaken or delay the live hero demo.

## 13. Exact changes from the current interface

| Current | Proposed | Reason |
| --- | --- | --- |
| Arial for UI and Georgia for branding/headings | Noto Sans for all UI; serif retained only for the wordmark | Clear hierarchy and multilingual consistency |
| Ad hoc font sizes, including 13–15px labels | Defined 16–40px type roles with 18px body | Senior readability |
| Bright red behind normal white text | Dark action red for white-text controls; bright red retained as brand accent | WCAG contrast |
| Three navigation items: Home, Call, My Kakis | Four items: Home, My Kakis, My Activities, Profile | Matches the approved information architecture |
| Call appears in navigation and on Home | Call launches only from the dominant Home action | One unmistakable starting point |
| Bottom navigation remains on the Call screen | Hide it during calls, proposals, confirmations, chat, and details | Reduce accidental exits and distraction |
| Log out appears in the Home header | Move Log out to the Profile settings area | Keeps Home focused on social planning |
| Separate See My Kakis Home button | Remove it; use persistent navigation | Avoid duplicate hierarchy |
| Text input is always visually prominent on Call | Voice first, with a visible Prefer to type option | Keeps voice primary without removing fallback |
| Proposal exposes the fallback trace | Show person/group/activity type and plain-language reason; keep trace diagnostic | Reduces technical clutter |
| Proposal lacks a complete logistics hierarchy | Always show who, what, date/time, venue, and reason | Builds trust before confirmation |
| My Kakis is a passive list | Add Find a new kaki, Ask KopiKaki, profile, and chat entry points | Supports meeting and maintaining connections |
| My Activities and Profile are absent | Add focused supporting destinations after the hero flow | Matches intended product scope |
| Multiple hardcoded component values | Reusable semantic tokens and shared primitives | Consistency and safer iteration |
| Small or inconsistent interactive areas | 56px minimum targets, 64px hero controls, 12px gaps | Reduced fine-motor demand |
| Mostly generic error display | Contextual messages that preserve state and offer recovery | Prevents dead ends |
| Existing KopiKaki and Lucide icons | Retain and standardize sizes/strokes | Preserves the current identity |

## 14. Verification and acceptance criteria

The design is implemented successfully when:

- a first-time user can identify Call KopiKaki as the main Home action without instruction;
- the full call → proposal → confirm → updated Home card flow works without a reload;
- matching still tries People → Groups → Activities in that order;
- all top-level screens use the same font roles, tokens, cards, and button hierarchy;
- every required action has a visible label and at least a 56 × 56px target;
- normal text and interactive controls meet WCAG AA contrast;
- the experience works at 200% zoom without horizontal scrolling or hidden actions;
- keyboard and screen-reader focus follow the visual order;
- reduced-motion mode communicates listening and progress without pulsing animation;
- voice failure always offers a preserved, usable typing fallback;
- loading, empty, offline, no-match, and confirmation-failure states provide a next action;
- the UI is checked at 320px, 375px, 390px, 430px, tablet width, and phone landscape;
- the hero flow is verified on a real phone over real Wi-Fi with an unfamiliar voice and Singlish.

## 15. Out of scope for the first implementation pass

- health, wellness, or engagement dashboards;
- streaks, points, or gamification;
- complex activity creation and calendar management;
- a second chatbot or separate assistant personality;
- gesture-only shortcuts;
- decorative dark mode, glassmorphism, rails, dot grids, or highlighter effects;
- replacing the existing KopiKaki or Lucide icon language;
- implementing supporting screens before the hero flow is stable.

## 16. Reference note

The external Canopy design document informed a small set of general design-system practices. KopiKaki's product requirements, elderly-accessibility needs, red-and-white identity, existing icons, mockups, and approved user flow determine all decisions in this document.
