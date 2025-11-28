'use client';

/**
 * FHE Context Provider
 *
 * Manages the global state for Fully Homomorphic Encryption (FHE) functionality
 * in the GuessNumber DApp. This context provides:
 * - FHE initialization status tracking
 * - Error handling for FHE operations
 * - Global access to FHE initialization function
 *
 * The FHE instance is required for encrypting sensitive game data (like guesses)
 * before submitting them to the blockchain, ensuring complete privacy.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFHE, isFHEInitialized } from '@/lib/fhe';

/**
 * FHE Context Type Definition
 *
 * @property {boolean} isInitialized - Whether FHE SDK has been successfully initialized
 * @property {boolean} isInitializing - Whether FHE SDK is currently initializing
 * @property {string | null} error - Error message if initialization failed
 * @property {Function} initialize - Function to manually trigger FHE initialization
 */
interface FHEContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
}

/**
 * FHE Context
 * React context for sharing FHE state across the application
 */
const FHEContext = createContext<FHEContextType | undefined>(undefined);

/**
 * FHE Provider Props
 * @property {ReactNode} children - Child components to be wrapped by the provider
 */
interface FHEProviderProps {
  children: ReactNode;
}

/**
 * FHE Provider Component
 *
 * Wraps the application and provides FHE initialization state and controls.
 * Automatically checks for existing FHE initialization on mount.
 *
 * @param {FHEProviderProps} props - Component props
 * @returns {JSX.Element} Provider component
 */
export function FHEProvider({ children }: FHEProviderProps) {
  // FHE initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize FHE SDK
   *
   * Loads and initializes the FHE WASM module and creates an FHE instance.
   * This is required before any encryption operations can be performed.
   *
   * @returns {Promise<void>}
   */
  const initialize = async () => {
    // Prevent duplicate initialization attempts
    if (isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Initialize FHE SDK from @zama-fhe/relayer-sdk
      await initializeFHE();
      setIsInitialized(true);
    } catch (err) {
      // Handle initialization errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize FHE';
      setError(errorMessage);
      console.error('[FHE Context] Initialization failed:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Check for existing FHE initialization on component mount
   *
   * If FHE was previously initialized (e.g., in another component),
   * update the context state to reflect that.
   */
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Check if FHE is already initialized
    if (isFHEInitialized()) {
      setIsInitialized(true);
    }
  }, []);

  /**
   * Context value object
   * Contains all FHE state and control functions
   */
  const value: FHEContextType = {
    isInitialized,
    isInitializing,
    error,
    initialize,
  };

  return (
    <FHEContext.Provider value={value}>
      {children}
    </FHEContext.Provider>
  );
}

/**
 * useFHE Hook
 *
 * Custom hook to access FHE context in any component.
 * Must be used within a FHEProvider.
 *
 * @returns {FHEContextType} FHE context value
 * @throws {Error} If used outside of FHEProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isInitialized, initialize } = useFHE();
 *
 *   useEffect(() => {
 *     if (!isInitialized) {
 *       initialize();
 *     }
 *   }, [isInitialized, initialize]);
 *
 *   return <div>FHE Status: {isInitialized ? 'Ready' : 'Not Ready'}</div>;
 * }
 * ```
 */
export function useFHE() {
  const context = useContext(FHEContext);
  if (context === undefined) {
    throw new Error('useFHE must be used within a FHEProvider');
  }
  return context;
}
