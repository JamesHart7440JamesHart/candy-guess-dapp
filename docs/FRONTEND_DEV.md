# GuessNumber Frontend Development Guide

        ## Identity & Theme
        - **Design Language**: Retro Grid — primary #FDE047, secondary #111827, accent #38BDF8, surface #1E293B, background #020617.
        - **Gradient Token**: linear-gradient(135deg, #FDE047 0%, #2563EB 100%)
        - **Font Pairing**: Karla + VT323

        ## Core Pages & Flows
        ### Route `/` — Game Lobby
                **Purpose**: Highlight live rounds, show sponsor banners, and drop players into action.
                - Hero scoreboard with encrypted pot totals and countdown timers.
- Round cards indicating difficulty, stake, and attempts so far (counts only).
- CTA row for 'Join Round' and 'Create Private Room'.

### Route `/round/[id]` — Guess Console
                **Purpose**: Submit guesses, view encrypted hints, and track round progress.
                - Number input with encryption status indicator and commit receipt.
- Hint history timeline showing higher/lower icons refreshed via websocket.
- Pot overview card with anonymised attempt counters and reveal ETA.

### Route `/hall-of-fame` — Hall of Fame
                **Purpose**: Celebrate streaks, badges, and sponsor challenges.
                - Leaderboard list with encrypted accuracy score badges.
- Badge gallery summarising limited-time achievements.
- Sponsors carousel linking to themed rooms.

        ## Signature Components
        - **GuessInput** — Numeric input with encryption pipeline feedback.
- **HintTicker** — Animated banner cycling through latest encrypted hint signals.
- **BadgeCard** — Collectible card showing badge art and encrypted criteria history.

        ## State & Data
        - React Query for round metadata; Zustand for active guess state; Pusher channels feed hints.
        - Smart contract data hydrated via wagmi `readContract` hooks with suspense wrappers.
        - Encryption context stored in React Context to avoid re-initialising the SDK per component.

        ## Encryption Workflow
        Initialise SDK, encode guess with `encryptUint16`, attach salt, broadcast via wagmi action.

        ## Realtime & Telemetry
        - Websocket updates deliver hints and attempt counters to all participants instantly.
        - Analytics via PostHog tracking conversion funnels and retention cohorts.
        - Error logging with Sentry capturing encryption or gateway issues.

        ## Testing & Quality
        - Playwright verifies guess submission/resubmission flows.
        - Unit tests for hint ticker animations responding to events.
        - Visual tests ensuring retro theme holds across dark/light toggles.
