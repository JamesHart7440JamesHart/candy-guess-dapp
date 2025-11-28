/**
 * Wagmi Configuration for GuessNumber DApp
 *
 * This file configures wallet connectors and blockchain network settings
 * using Wagmi v2 and RainbowKit v2 for Web3 wallet integration.
 *
 * Features:
 * - Multi-wallet support (MetaMask, Rainbow, WalletConnect, Ledger, Brave, Safe)
 * - Coinbase wallet is intentionally excluded
 * - Sepolia testnet configuration with custom RPC
 * - FHE contract addresses and round configuration
 */

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  ledgerWallet,
  braveWallet,
  safeWallet
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

// Environment variables with fallback defaults
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a01e2fcfd61c20af8be75d53c72f1cbc";
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const DISABLE_WALLET_KIT = process.env.NEXT_PUBLIC_DISABLE_WALLETKIT === "1";

/**
 * Wallet Connectors Configuration
 *
 * Configures supported wallet providers for the DApp.
 * Coinbase wallet is intentionally excluded from the list.
 *
 * Supported wallets:
 * - MetaMask: Most popular Ethereum wallet
 * - Rainbow: Mobile-first wallet with great UX
 * - WalletConnect: Universal wallet connection protocol
 * - Ledger: Hardware wallet for enhanced security
 * - Brave: Built-in wallet in Brave browser
 * - Safe: Multi-sig wallet (formerly Gnosis Safe)
 */
const connectors = DISABLE_WALLET_KIT
  ? []
  : connectorsForWallets(
      [
        {
          groupName: "Recommended",
          wallets: [
            metaMaskWallet,
            rainbowWallet,
            walletConnectWallet,
            ledgerWallet,
            braveWallet,
            safeWallet
            // Note: coinbaseWallet is intentionally excluded
          ]
        }
      ],
      {
        appName: "GuessNumber - FHE Game",
        projectId: PROJECT_ID
      }
    );

/**
 * Wagmi Configuration
 *
 * Main configuration object for Wagmi client that handles:
 * - Chain configuration (Sepolia testnet)
 * - Wallet connectors
 * - RPC transport layer
 * - Server-side rendering settings
 */
export const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(RPC_URL)
  },
  ssr: false // Disable SSR to prevent hydration issues
});

/**
 * Sepolia Network Configuration
 *
 * Configuration object for Sepolia testnet with network details
 * and block explorer information.
 */
export const SEPOLIA_CONFIG = {
  chainId: sepolia.id,
  name: "Sepolia",
  rpcUrl: RPC_URL,
  blockExplorerUrl: "https://sepolia.etherscan.io",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  }
} as const;

/**
 * Smart Contract Addresses
 *
 * Deployed contract addresses on Sepolia testnet.
 * These addresses are loaded from environment variables.
 */
export const CONTRACT_ADDRESSES = {
  GUESS_NUMBER_GAME: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"
} as const;

/**
 * Default Round ID
 *
 * The default game round ID to use when navigating to the game.
 * Can be configured via NEXT_PUBLIC_DEFAULT_ROUND_ID environment variable.
 */
export const DEFAULT_ROUND_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_ROUND_ID || "1");
