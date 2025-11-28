# GuessNumber - FHE-Powered Number Guessing Game

A privacy-preserving number guessing game built with Fully Homomorphic Encryption (FHE) technology. Players submit encrypted guesses that are compared on-chain without revealing the secret number until the round ends.

## 🎯 Overview

GuessNumber leverages Zama's fhEVM technology to enable truly private gameplay. All guesses are encrypted client-side before being submitted to the blockchain, ensuring that:
- Players' strategies remain confidential
- The secret number stays hidden until reveal
- On-chain comparisons happen on encrypted data
- Game fairness is cryptographically guaranteed

## 🚀 Live Demo

- **Frontend**: https://guessnumber-fhe.vercel.app
- **Smart Contract**: [0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9](https://sepolia.etherscan.io/address/0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9)
- **Network**: Sepolia Testnet
- **GitHub**: https://github.com/JamesHart7440JamesHart/candy-guess-dapp

## ✨ Features

### 🔐 FHE-Encrypted Guesses
Every guess is encrypted using Zama's relayer SDK before hitting the blockchain. Complete privacy guaranteed.

### 📊 Smart Hints
Receive encrypted hints (higher/lower) without exposing your guess or the secret number to anyone.

### 🎉 On-Chain Verification
All game logic runs on-chain with cryptographic proofs. No trusted third parties required.

### 🌐 Multi-Wallet Support
Seamless integration with Rainbow, MetaMask, WalletConnect, Ledger, Brave, and Safe wallets.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Wagmi v2 + RainbowKit v2
- **FHE**: @zama-fhe/relayer-sdk v0.3.0-5 (CDN-loaded)
- **Smart Contracts**: Solidity + @fhevm/solidity v0.9.x
- **Development**: Hardhat, Playwright
- **Deployment**: Vercel + Sepolia Testnet

## 📦 Installation

### Prerequisites

- Node.js 20+ (use `nvm use 20` if available)
- npm 10+
- Metamask or compatible Web3 wallet

### Setup

```bash
# Clone the repository
git clone https://github.com/JamesHart7440JamesHart/candy-guess-dapp.git
cd candy-guess-dapp

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:3000

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_DEFAULT_ROUND_ID=1
```

### For Contract Deployment

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

## 📜 Smart Contract

### Deployment

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy:sepolia
```

### Contract Address

**Sepolia**: `0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9`

[View on Etherscan](https://sepolia.etherscan.io/address/0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9)

### Key Functions

- `submitGuess(uint256 roundId, bytes calldata encryptedGuess, bytes calldata inputProof)` - Submit encrypted guess
- `requestRoundReveal(uint256 roundId)` - Request secret number reveal
- `cancelReveal(uint256 roundId)` - Cancel pending reveal request

## 🎮 How to Play

1. **Connect Wallet**: Click "Start Playing" and connect your Web3 wallet
2. **Initialize FHE**: The app automatically initializes Zama's FHE encryption
3. **Submit Guess**: Enter a number between 1-100 and submit (encrypted automatically)
4. **Get Hints**: Receive encrypted feedback (higher/lower)
5. **Win Round**: Keep guessing until you find the secret number!

## 🏗️ Architecture

### Frontend Flow

```
User Input → FHE Encryption → Smart Contract → Encrypted Storage
                ↓                    ↓
         Encrypted Hint ← On-Chain Comparison
```

### FHE Integration

The app uses Zama's relayer SDK loaded via CDN for optimal performance:

```typescript
// Loaded in app/layout.tsx
<script src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs" />

// Used in src/lib/fhe.ts
const sdk = window.RelayerSDK;
await sdk.initSDK();
const fheInstance = await sdk.createInstance(SepoliaConfig);
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
# Install Playwright browsers (once)
npx playwright install chromium

# Run tests
npm run test:e2e
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run Hardhat tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |

## 🔒 Security Features

- **Client-Side Encryption**: All guesses encrypted before leaving browser
- **Zero-Knowledge Proofs**: Cryptographic proofs verify guess validity
- **No Plaintext Exposure**: Secret number never exposed until official reveal
- **ACL Protection**: Access control lists manage encrypted data permissions
- **Fail-Closed Design**: Smart contract fails safely on invalid inputs

## 🌟 Key Highlights

✅ **Privacy-First**: Complete gameplay privacy using FHE
✅ **Trustless**: No central authority or trusted third party
✅ **On-Chain**: All logic verified on Ethereum blockchain
✅ **User-Friendly**: Seamless UX despite complex cryptography
✅ **Production-Ready**: Deployed on Sepolia with Vercel hosting

## 📚 Documentation

- [Zama fhEVM Docs](https://docs.zama.ai/fhevm)
- [Smart Contract Source](./contracts/GuessNumberGame.sol)
- [Frontend Architecture](./docs/FRONTEND_DEV.md)
- [Backend Development](./docs/BACKEND_DEV.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is part of the Zama Developer Program.

## 🔗 Links

- **Live Demo**: https://guessnumber-fhe.vercel.app
- **GitHub**: https://github.com/JamesHart7440JamesHart/candy-guess-dapp
- **Contract**: https://sepolia.etherscan.io/address/0xEEEd804dA7FC8e027916ca6789dc79AD054c74e9
- **Zama**: https://zama.ai

## 👨‍💻 Developer

Built by JamesHart7440JamesHart for the Zama Developer Program

---

**Note**: This is a demo application on Sepolia testnet. Use test ETH only.
