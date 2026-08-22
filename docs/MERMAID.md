# Architecture Diagram

Current implementation state (see [ARCHITECTURE.md](./ARCHITECTURE.md) for the narrative, [AGENTS.md](../AGENTS.md) for the binding decisions). Agent/memory architecture proposal lives in [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md).

```mermaid
flowchart TD
    subgraph Browser["Browser (Next.js Client Components)"]
        CallScreen["CallScreen<br/>voice + text fallback"]
        HomeScreen["HomeScreen / MatchScreen / KakisScreen"]
    end

    subgraph Firebase["Firebase project (Blaze)"]
        Auth["Firebase Auth<br/>anonymous demo sign-in<br/>(phone OTP staged, not yet wired)"]
        Firestore[("Firestore<br/>users · kakis · groups · activities · meetups")]
        AppHosting["Firebase App Hosting<br/>serves the Next.js app"]
    end

    subgraph Server["Next.js Route Handlers (Node runtime)"]
        LiveToken["/api/live-token<br/>mints 1-use ephemeral token"]
        Match["/api/match<br/>intent → People→Groups→Activities matcher"]
    end

    subgraph Google["Google AI"]
        GeminiLive["Gemini 3.1 Flash Live Preview<br/>(voice, audio in/out)"]
        Gemini36["Gemini 3.6 Flash<br/>(intent extraction, function calling)"]
    end

    CallScreen -- "0. sign in" --> Auth
    CallScreen -- "1. request token" --> LiveToken
    LiveToken -- "mints token (key stays server-side)" --> GeminiLive
    LiveToken -- "ephemeral token" --> CallScreen
    CallScreen -- "2. live audio session\n(direct, using ephemeral token)" --> GeminiLive

    CallScreen -- "3. transcript / typed request" --> Match
    Match -- "4. function-calling intent parse\n(falls back to local parser if unavailable)" --> Gemini36
    Match -- "5. read candidates, write kaki + meetup" --> Firestore

    Firestore -- "6. onSnapshot (meetups, kakis)" --> HomeScreen

    AppHosting -.serves.-> Browser
```

**Note:** ARCHITECTURE.md describes voice as fully relayed through the Route Handler. In code, only token minting is server-side (`/api/live-token`) — the browser then holds a live audio session with Gemini directly using that ephemeral, single-use token. This still satisfies the AGENTS.md trust boundary ("mint ephemeral tokens **or** relay every call") — the API key itself never reaches the client — but it's a different pattern from a full relay, worth knowing if you're tracing the audio path.
