# GuessNumber Backend Development Guide

        ## Contract System
        ### RoundFactory
Spins up guess rounds, encrypts target number, and tracks stake sizes.

- **FHE Logic**: Target encoded as ciphertext with salt; `TFHE.lt` generates encrypted hints.
- **Key Functions**: `createRound`, `adjustStake`, `closeRound`

### GuessVault
Captures encrypted guesses and ensures one active guess per player per round.

- **FHE Logic**: `TFHE.eq` identifies correct guess ciphertext; `TFHE.add` tracks attempt counts.
- **Key Functions**: `submitGuess`, `updateGuess`, `lockGuess`

### RewardDistributor
Settles pots, mints brag badges, and records encrypted leaderboard metrics.

- **FHE Logic**: Gateway decrypt returns winner list and number; payouts streamed via claim function.
- **Key Functions**: `requestReveal`, `settleRewards`, `claimBadge`

        ## Storage Layout
        - `mapping(uint256 => RoundState)` storing encrypted number, stake, and timers.
- `mapping(uint256 => mapping(address => GuessEnvelope))` with ciphertext guess and last hint hash.
- `mapping(uint256 => EncryptedStats)` tracking attempt distribution until reveal.

        ## Gateway & Relayer Coordination
        - Gateway ensures round closed before decrypting answer + winners.
- Hint calculations verified by comparing hashed transcripts from contract.
- Alerting triggers if reveal queue stalls beyond configured SLA.

        ## Offchain Services
        - Leaderboard microservice for daily/weekly champion banners.
- Notification worker sending hints (higher/lower) to connected clients in real time.
- Content CMS powering themed events and sponsor assets.

        ## Testing Strategy
        - Hardhat tests covering hint correctness, winner detection, and refund logic.
- Fuzz cases ensuring encrypted stats never overflow.
- Gateway mocks verifying reveals blocked until round close.

        ## Deployment Playbook
        - Deploy `GuessNumberGame.sol` with admin-controlled difficulty presets.
- Cron worker resets daily leaderboards and publishes sponsor content.
- Vercel deploy integrates websockets for hint pushes.
