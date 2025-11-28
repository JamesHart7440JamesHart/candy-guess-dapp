/**
 * FHE Instance Initialization for GuessNumber Game
 *
 * This module handles FHE SDK initialization using CDN script tag.
 * SDK is loaded via script tag in app/layout.tsx and accessed through window object.
 *
 * Based on Zama fhEVM 0.9.x and relayer-sdk 0.3.0-5
 */

import { bytesToHex } from 'viem';

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

type FhevmInstance = any;

let fheInstance: FhevmInstance | null = null;
let isInitializing = false;
let initializationPromise: Promise<any> | null = null;

/**
 * Extract Relayer SDK from the window object
 */
function getSdkFromWindow() {
  if (typeof window === 'undefined') {
    throw new Error('[FHE] Relayer SDK requires a browser environment');
  }

  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error('[FHE] Relayer SDK not loaded. Ensure the CDN script is present in layout.tsx');
  }

  return sdk;
}

/**
 * Initialize FHE SDK from window object (loaded via CDN script tag)
 * Uses singleton pattern to ensure single instance
 *
 * @param provider - Optional Ethereum provider
 * @returns Promise<FHEInstance> - Initialized FHE instance
 * @throws Error if initialization fails
 */
export async function initializeFHE(provider?: any): Promise<any> {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('[FHE] Cannot initialize FHE in server-side environment');
  }

  // Return existing instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Using existing instance');
    return fheInstance;
  }

  // Wait for ongoing initialization
  if (isInitializing && initializationPromise) {
    console.log('[FHE] Waiting for ongoing initialization');
    return initializationPromise;
  }

  isInitializing = true;
  console.log('[FHE] Starting initialization from window.RelayerSDK...');

  initializationPromise = (async () => {
    try {
      // Get SDK from window object (loaded via script tag)
      const sdk = getSdkFromWindow();
      console.log('[FHE] SDK loaded from window object');

      const { initSDK, createInstance, SepoliaConfig } = sdk;

      // Initialize WASM module
      console.log('[FHE] Initializing WASM...');
      await initSDK();
      console.log('[FHE] WASM initialized');

      // Get Ethereum provider (only available in browser)
      const ethereumProvider =
        provider ||
        window.ethereum ||
        window.okxwallet?.provider ||
        window.okxwallet ||
        SepoliaConfig.network;

      // Create FHE instance with Sepolia configuration
      console.log('[FHE] Creating FHE instance with SepoliaConfig...');
      const config = {
        ...SepoliaConfig,
        network: ethereumProvider,
      };

      fheInstance = await createInstance(config);
      console.log('[FHE] Instance created successfully');

      return fheInstance;
    } catch (error) {
      console.error('[FHE] Initialization failed:', error);
      isInitializing = false;
      initializationPromise = null;
      throw new Error(`FHE initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isInitializing = false;
    }
  })();

  return initializationPromise;
}

/**
 * Reset FHE instance (useful for testing or error recovery)
 */
export function resetFHE(): void {
  fheInstance = null;
  isInitializing = false;
  initializationPromise = null;
}

/**
 * Get current FHE instance
 * @returns FHE instance or null if not initialized
 */
export function getFheInstance() {
  return fheInstance;
}

/**
 * Check if FHE is initialized
 * @returns boolean
 */
export function isFHEInitialized(): boolean {
  return fheInstance !== null;
}

/**
 * Create encrypted input for contract call
 *
 * @param contractAddress - Target contract address
 * @param userAddress - User wallet address
 * @returns EncryptedInput builder instance
 * @throws Error if FHE not initialized
 */
export async function createEncryptedInput(
  contractAddress: string,
  userAddress: string
) {
  if (!fheInstance) {
    throw new Error('FHE not initialized. Call initializeFHE() first.');
  }

  return fheInstance.createEncryptedInput(contractAddress, userAddress);
}

/**
 * Encrypt a guess number for the game (1-100)
 * Uses uint16 to match the contract's euint16 type
 *
 * @param guess - The number to encrypt (1-100)
 * @param contractAddress - The contract address
 * @param userAddress - The user's wallet address
 * @returns Promise<{ handle: string; inputProof: string }>
 */
export async function encryptGuess(
  guess: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; inputProof: string }> {
  console.log(`[FHE] Encrypting guess value: ${guess}`);

  // Validate input
  if (guess < 1 || guess > 100) {
    throw new Error('Guess must be between 1 and 100');
  }

  if (!fheInstance) {
    throw new Error('FHE not initialized');
  }

  try {
    // Create encrypted input
    const input = fheInstance.createEncryptedInput(contractAddress, userAddress);

    // Add uint16 value (contract uses euint16)
    input.add16(BigInt(guess));

    // Encrypt and get handles + proof
    const encrypted = await input.encrypt();

    console.log('[FHE] Encryption successful');
    console.log('[FHE] Handle (raw):', encrypted.handles[0]);
    console.log('[FHE] Proof length:', encrypted.inputProof.length);

    // Convert Uint8Array to hex using viem's bytesToHex
    const handleHex = bytesToHex(encrypted.handles[0]);
    const proofHex = bytesToHex(encrypted.inputProof);

    console.log('[FHE] Handle (hex):', handleHex);
    console.log('[FHE] Proof (hex):', proofHex);

    return {
      handle: handleHex,
      inputProof: proofHex,
    };
  } catch (error) {
    console.error('[FHE] Encryption failed:', error);
    throw new Error(`Failed to encrypt guess: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt multiple values in a single operation
 * @param values - Array of values to encrypt (each 1-100)
 * @param contractAddress - The contract address
 * @param userAddress - The user's wallet address
 * @returns Promise<{ handles: string[]; inputProof: string }>
 */
export async function encryptBatch(
  values: number[],
  contractAddress: string,
  userAddress: string
): Promise<{ handles: string[]; inputProof: string }> {
  console.log(`[FHE] Encrypting batch of ${values.length} values`);

  if (!fheInstance) {
    throw new Error('FHE not initialized');
  }

  try {
    // Create encrypted input
    const input = fheInstance.createEncryptedInput(contractAddress, userAddress);

    // Add all values as uint16
    for (const value of values) {
      if (value < 1 || value > 100) {
        throw new Error(`Value ${value} must be between 1 and 100`);
      }
      input.add16(BigInt(value));
    }

    // Encrypt and get handles + proof
    const encrypted = await input.encrypt();

    console.log('[FHE] Batch encryption successful');

    // Convert all handles to hex
    const handlesHex = encrypted.handles.map((handle: Uint8Array) => bytesToHex(handle));
    const proofHex = bytesToHex(encrypted.inputProof);

    return {
      handles: handlesHex,
      inputProof: proofHex,
    };
  } catch (error) {
    console.error('[FHE] Batch encryption failed:', error);
    throw new Error(`Failed to encrypt values: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Public decrypt with proof (fhevm 0.9.x Self-Relaying mode)
 * Decrypts publicly decryptable values and returns cleartext + KMS proof
 *
 * @param handles - Array of encrypted value handles (bytes32[])
 * @returns Promise<{ cleartexts: any[]; proof: string }> - Decrypted values and proof
 */
export async function publicDecryptWithProof(
  handles: string[]
): Promise<{ cleartexts: any[]; proof: string }> {
  console.log(`[FHE] Public decrypting ${handles.length} handles`);

  if (!fheInstance) {
    throw new Error('FHE not initialized');
  }

  try {
    // Call publicDecrypt which returns cleartexts and proof
    const result = await fheInstance.publicDecrypt(handles);

    console.log('[FHE] Public decryption successful');
    console.log('[FHE] Cleartexts:', result.cleartexts);
    console.log('[FHE] Proof length:', result.proof?.length || 0);

    return {
      cleartexts: result.cleartexts || result, // Handle both formats
      proof: result.proof || '0x', // Some versions return proof separately
    };
  } catch (error) {
    console.error('[FHE] Public decryption failed:', error);
    throw new Error(`Failed to decrypt values: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a single value (legacy, for development/debugging)
 * Note: For production use publicDecryptWithProof instead
 *
 * @param encryptedValue - The encrypted value to decrypt
 * @returns Promise<number>
 */
export async function decryptValue(encryptedValue: string): Promise<number> {
  if (!fheInstance) {
    throw new Error('FHE not initialized');
  }

  try {
    const result = await fheInstance.publicDecrypt([encryptedValue]);
    const cleartexts = result.cleartexts || result;
    return Number(cleartexts[0]);
  } catch (error) {
    console.error('[FHE] Decryption failed:', error);
    throw new Error(`Failed to decrypt value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
