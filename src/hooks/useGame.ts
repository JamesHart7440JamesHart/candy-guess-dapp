'use client';

import { useCallback, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { encryptGuess } from "@/lib/fhe";
import { CONTRACT_ADDRESSES, DEFAULT_ROUND_ID } from "@/lib/wagmi";
import { guessNumberGameAbi } from "@/lib/abi/guessNumberGame";

const ENTRY_FEE = parseEther("0.001");

type RoundInfo = {
  startTime: number;
  endTime: number;
  isActive: boolean;
  totalGuesses: number;
  potHandle: `0x${string}`;
};

type PlayerState = {
  hasSubmitted: boolean;
  guessTime: number;
  encryptedGuess: `0x${string}`;
  encryptedHint: `0x${string}`;
};

type RevealStatus = {
  isRevealed: boolean;
  revealPending: boolean;
  revealedSecret: number;
  winner: string;
  requestId: bigint;
};

export function useGame(roundIdParam?: number) {
  const { address, isConnected } = useAccount();
  const roundId = roundIdParam && roundIdParam > 0 ? roundIdParam : DEFAULT_ROUND_ID;

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundInfoQuery = useReadContract({
    address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
    abi: guessNumberGameAbi,
    functionName: "getRoundInfo",
    args: [BigInt(roundId)],
    query: {
      enabled: !!roundId
    }
  });

  const playerStateQuery = useReadContract({
    address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
    abi: guessNumberGameAbi,
    functionName: "getPlayerState",
    args: address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: !!address && !!roundId
    }
  });

  const revealStatusQuery = useReadContract({
    address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
    abi: guessNumberGameAbi,
    functionName: "getRevealStatus",
    args: [BigInt(roundId)],
    query: {
      enabled: !!roundId,
      refetchInterval: 15000
    }
  });

  const hasWonQuery = useReadContract({
    address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
    abi: guessNumberGameAbi,
    functionName: "hasPlayerWon",
    args: address ? [BigInt(roundId), address] : undefined,
    query: {
      enabled: !!address && !!roundId && Boolean(revealStatusQuery.data?.[0])
    }
  });

  const { writeContractAsync } = useWriteContract();

  const submitGuess = useCallback(
    async (guess: number) => {
      if (!isConnected || !address) {
        throw new Error("Please connect your wallet before submitting a guess.");
      }

      if (guess < 1 || guess > 100) {
        throw new Error("Guess must be between 1 and 100.");
      }

      setIsSubmitting(true);
      setSubmissionError(null);

      try {
        const { handle, inputProof } = await encryptGuess(
          guess,
          CONTRACT_ADDRESSES.GUESS_NUMBER_GAME,
          address
        );

        await writeContractAsync({
          address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
          abi: guessNumberGameAbi,
          functionName: "submitGuess",
          args: [BigInt(roundId), handle as `0x${string}`, inputProof as `0x${string}`],
          value: ENTRY_FEE
        });

        await Promise.allSettled([
          roundInfoQuery.refetch?.(),
          playerStateQuery.refetch?.(),
          revealStatusQuery.refetch?.()
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSubmissionError(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [address, isConnected, roundId, writeContractAsync, roundInfoQuery.refetch, playerStateQuery.refetch, revealStatusQuery.refetch]
  );

  const roundInfo = useMemo<RoundInfo | null>(() => {
    const data = roundInfoQuery.data;
    if (!data) return null;
    const [start, end, active, total, pot] = data;
    return {
      startTime: Number(start ?? 0n),
      endTime: Number(end ?? 0n),
      isActive: Boolean(active),
      totalGuesses: Number(total ?? 0n),
      potHandle: (pot ?? "0x") as `0x${string}`
    };
  }, [roundInfoQuery.data]);

  const playerState = useMemo<PlayerState | null>(() => {
    const data = playerStateQuery.data;
    if (!data) return null;
    const [hasSubmitted, guessTime, encryptedGuess, encryptedHint] = data;
    return {
      hasSubmitted: Boolean(hasSubmitted),
      guessTime: Number(guessTime ?? 0),
      encryptedGuess: (encryptedGuess ?? "0x") as `0x${string}`,
      encryptedHint: (encryptedHint ?? "0x") as `0x${string}`
    };
  }, [playerStateQuery.data]);

  const revealStatus = useMemo<RevealStatus | null>(() => {
    const data = revealStatusQuery.data;
    if (!data) return null;
    const [isRevealed, revealPending, revealedSecret, winner, requestId] = data;
    return {
      isRevealed: Boolean(isRevealed),
      revealPending: Boolean(revealPending),
      revealedSecret: Number(revealedSecret ?? 0),
      winner: winner ?? "0x0000000000000000000000000000000000000000",
      requestId: requestId ?? 0n
    };
  }, [revealStatusQuery.data]);

  return {
    roundId,
    roundInfo,
    playerState,
    revealStatus,
    hasPlayerWon: Boolean(hasWonQuery.data),
    isSubmitting,
    isLoading: roundInfoQuery.isLoading || playerStateQuery.isLoading,
    submissionError,
    submitGuess,
    refetchRoundInfo: roundInfoQuery.refetch,
    refetchPlayerState: playerStateQuery.refetch
  };
}
