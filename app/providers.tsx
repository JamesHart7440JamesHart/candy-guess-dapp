'use client';

/**
 * Providers Component
 *
 * Root-level provider wrapper that initializes all necessary contexts and providers
 * for the GuessNumber DApp, including:
 * - Wagmi: Ethereum wallet connection and interaction
 * - RainbowKit: Wallet connection UI
 * - TanStack Query: Data fetching and caching
 * - FHE: Fully Homomorphic Encryption context
 *
 * This component wraps the entire application and provides global state management.
 */

import "@rainbow-me/rainbowkit/styles.css";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { FHEProvider } from "@/contexts/FHEContext";

/**
 * Providers Component
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped by providers
 * @returns {JSX.Element} Provider tree wrapping the application
 */
export function Providers({ children }: { children: ReactNode }) {
  /**
   * TanStack Query Client Configuration
   *
   * Configures caching and refetching behavior for blockchain queries.
   * Settings optimized for Web3 applications where data changes are event-driven
   * rather than time-based.
   */
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching to reduce unnecessary RPC calls
        refetchOnWindowFocus: false,  // Don't refetch when window regains focus
        refetchOnMount: false,         // Don't refetch when component mounts
        refetchOnReconnect: false,     // Don't refetch on network reconnect
        retry: 1,                      // Only retry failed queries once
        staleTime: 5 * 60 * 1000,      // Consider data fresh for 5 minutes
      },
    },
  }));

  /**
   * Check if WalletKit (RainbowKit UI) should be disabled
   * Useful for testing or environments where wallet UI is not needed
   */
  const disableWalletKit = process.env.NEXT_PUBLIC_DISABLE_WALLETKIT === "1";

  /**
   * Core content wrapped in QueryClient and FHE providers
   * This is the minimum required provider tree
   */
  const content = (
    <QueryClientProvider client={queryClient}>
      <FHEProvider>{children}</FHEProvider>
    </QueryClientProvider>
  );

  /**
   * Minimal provider tree when WalletKit UI is disabled
   * Still includes Wagmi for wallet connection functionality
   */
  if (disableWalletKit) {
    return <WagmiProvider config={config}>{content}</WagmiProvider>;
  }

  /**
   * Full provider tree with RainbowKit wallet connection UI
   *
   * Provider hierarchy (outside to inside):
   * 1. WagmiProvider: Ethereum wallet connection and chain management
   * 2. QueryClientProvider: Data fetching and caching for blockchain queries
   * 3. RainbowKitProvider: Wallet connection modal UI with custom theming
   * 4. FHEProvider: Fully Homomorphic Encryption context for privacy features
   */
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#FDE047",            // Yellow accent matching game theme
            accentColorForeground: "#111827",  // Dark text on yellow background
            borderRadius: "large",             // Rounded corners for modern look
            overlayBlur: "small"               // Subtle blur effect on modal backdrop
          })}
          modalSize="compact"                  // Compact modal for better mobile UX
        >
          <FHEProvider>{children}</FHEProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
