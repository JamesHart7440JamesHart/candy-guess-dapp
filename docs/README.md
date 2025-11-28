# GuessNumber - Privacy-Preserving Number Guessing Game


## Vision
GuessNumber is a casual staking game where challengers guess a hidden number encrypted on-chain.
Players submit encrypted guesses, receive encrypted hints, and only final outcomes are revealed once
the round closes, keeping strategies confidential while ensuring fairness.


## Market Fit & Sustainability
- On-chain casinos adding transparent mini-games without exposing player heuristics.
- Streamer communities hosting interactive prediction rounds with prizes.
- Educational hubs teaching FHE basics via playful experiences.


## FHE-First Architecture
- Secret number stored as `euint16`; guesses encrypted and compared via `TFHE.eq`/`TFHE.lt`.
- Hint engine computes encrypted higher/lower flags without revealing true value.
- Gateway reveals winning guess and aggregated stats only after round expiry.


## Token & Revenue Model
- House take on each pot plus optional ad placements in the lobby.
- Season pass NFTs unlocking themed rooms and higher stakes.
- Sponsorship tie-ins for brands running special rounds.


## Contract Modules
- **RoundFactory** — Spins up guess rounds, encrypts target number, and tracks stake sizes. Target encoded as ciphertext with salt; `TFHE.lt` generates encrypted hints.
  - Functions: `createRound`, `adjustStake`, `closeRound`
- **GuessVault** — Captures encrypted guesses and ensures one active guess per player per round. `TFHE.eq` identifies correct guess ciphertext; `TFHE.add` tracks attempt counts.
  - Functions: `submitGuess`, `updateGuess`, `lockGuess`
- **RewardDistributor** — Settles pots, mints brag badges, and records encrypted leaderboard metrics. Gateway decrypt returns winner list and number; payouts streamed via claim function.
  - Functions: `requestReveal`, `settleRewards`, `claimBadge`


## Frontend Experience
- **Theme**: Retro Grid • Primary #FDE047 • Accent #38BDF8
- **Font Pairing**: Karla + VT323
- **Realtime UX**: Websocket updates deliver hints and attempt counters to all participants instantly.


## Deployment & Operations
- Deploy `GuessNumberGame.sol` with admin-controlled difficulty presets.
- Cron worker resets daily leaderboards and publishes sponsor content.
- Vercel deploy integrates websockets for hint pushes.


## Roadmap
- Launch cooperative team mode with encrypted shared guesses.
- Add DAO governance to vote on new difficulty tiers.
- Integrate fiat ramps for casual player onboarding.


## Partnership Targets
- Game guilds seeking casual encrypted titles.
- Education cohorts hosting cryptography workshops.
- Sponsoring brands running interactive campaigns.
