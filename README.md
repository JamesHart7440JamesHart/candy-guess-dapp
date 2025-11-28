# GuessNumber – Fully Homomorphic Guessing Game

Next.js + Wagmi + RainbowKit front end backed by a `@fhevm/solidity` smart contract. Players submit guesses that are encrypted client-side with Zama’s relayer SDK and processed on-chain through fail-closed FHE logic.

## Stack

- **Next.js 14 / React 18** with the App Router
- **Tailwind CSS** + shadcn/ui components
- **Wagmi 2 + RainbowKit 2** (Coinbase connector disabled)
- **Hardhat** for contract compilation, testing, deployment, verification
- **@zama-fhe/relayer-sdk@0.2.0** for encryption
- **@fhevm/solidity@^0.8.0** contracts (Sepolia configuration)
- **Playwright** smoke tests for the client shell

## Requirements

- Node.js 20 (use `nvm use 20` if available)
- npm 10+
- Optional: `forge`/`cast` if extending on-chain tooling

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

The development server hydrates purely on the client; wallet UI is disabled automatically when `NEXT_PUBLIC_DISABLE_WALLETKIT=1` (used during Playwright runs).

## Environment variables

Create `.env.local` with the following values before running production builds or the deployed site:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourSepoliaDeployment
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_DEFAULT_ROUND_ID=1

# hardhat / deployment
PRIVATE_KEY=0xprivate_key_for_deployer
ETHERSCAN_API_KEY=your_etherscan_api_key
```

The deployment script writes a ready-to-use `.env.local` after each run.

## Useful npm scripts

| command | purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (Next + type-check) |
| `npm run lint` | Next lint pipeline |
| `npm run compile` | Hardhat contract compilation |
| `npm run test` | Hardhat unit tests (FHE mocks) |
| `npm run deploy:sepolia` | Deploy contract using Hardhat (writes `.env.local` + `deployment.json`) |
| `npm run test:e2e` | Playwright smoke test (wallet UI disabled automatically) |

> _Note:_ `npm run build` and `npm run dev` emit warnings about optional peer dependencies from MetaMask / WalletConnect. These modules pull native bridge packages we purposely do not install; the DApp still functions as expected.

## Contract toolchain

```
# compile & generate typechain
npm run compile

# run Solidity + FHE aware tests (skips heavy FHE checks when not mockable)
npm run test

# deploy to Sepolia (requires PRIVATE_KEY + ETHERSCAN_API_KEY)
npm run deploy:sepolia

# verify (optional)
npm run verify:sepolia -- <contract> <args>
```

`contracts/GuessNumberGame.sol` implements:

- `externalEuint16` inputs validated via `FHE.fromExternal`
- Range checks with fail-closed `FHE.select`
- Hint computation stored per player with ACL (`FHE.allow`) and decryption-ready handles
- Gateway reveal flow with timeout cancellation (`requestRoundReveal`, `cancelReveal`)
- Strict Sepolia configuration (`SepoliaConfig`)

Corresponding Hardhat tests (`test/GuessNumberGame.test.ts`) use the FHE plugin mock to verify ACL and fail-closed semantics.

## Frontend notes

- All components that mutate state are client components (`'use client'`)
- `src/hooks/useGame.ts` wraps wagmi reads/writes around the latest ABI (`src/lib/abi/guessNumberGame.ts`)
- `src/lib/fhe.ts` lazily imports `@zama-fhe/relayer-sdk/bundle` and caches the SDK instance
- Wallet connectors exclude Coinbase and default to WalletConnect, MetaMask, Rainbow, Ledger, Brave, Safe
- Setting `NEXT_PUBLIC_DISABLE_WALLETKIT=1` (as done in the Playwright script) removes RainbowKit and renders a stub button so tests can run without a wallet

## Playwright

Playwright is configured in `playwright.config.ts`. The helper script starts the dev server and runs lightweight UI assertions. Wallet connectors are stubbed via `NEXT_PUBLIC_DISABLE_WALLETKIT=1` so tests do not require an injected provider.

```
# install browsers (once)
npx playwright install chromium

# run smoke tests
npm run test:e2e
```

To run full wallet flows, clear the `NEXT_PUBLIC_DISABLE_WALLETKIT` variable and ensure a persistent browser profile has an authorised test wallet (see `PLAYWRIGHT_MCP_GUIDE.md`).

## Deployment

1. Deploy the contract (`npm run deploy:sepolia`) and record the address.
2. Populate `.env.local` with the new contract address and WalletConnect project id.
3. `npm run build` → deploy the `.next` output (or push to Vercel; `vercel.json` keeps SPA rewrites).

## Troubleshooting

- **Metamask / WalletConnect build warnings** – safe to ignore locally; install `@react-native-async-storage/async-storage` and `pino-pretty` only if you need native bridges.
- **Playwright cannot find wallet UI** – ensure `NEXT_PUBLIC_DISABLE_WALLETKIT` is set to `1` when running the smoke test, or configure the persisted browser profile with an authorised wallet as described in the MCP guide.
- **FHE initialisation errors** – confirm you are running in a browser (SDK cannot execute on the server) and that Sepolia gateways are reachable.
