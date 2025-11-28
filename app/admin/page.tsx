'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { ArrowLeft, Shield, Wallet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFHE } from "@/contexts/FHEContext";
import { encryptGuess } from "@/lib/fhe";
import { CONTRACT_ADDRESSES } from "@/lib/wagmi";
import { guessNumberGameAbi } from "@/lib/abi/guessNumberGame";

const ENTRY_FEE = parseEther("0.001");

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isInitialized, isInitializing, initialize } = useFHE();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [secretNumber, setSecretNumber] = useState<string>("42");
  const [duration, setDuration] = useState<string>("300");
  const [isCreating, setIsCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Generate stable positions for floating candies
  const floatingCandies = useMemo(() => {
    const candies = ["🍬", "🍭", "🍡", "🧁", "🍩"];
    return Array.from({ length: 15 }).map((_, index) => ({
      icon: candies[index % 5],
      left: (index * 19 + index * index * 5) % 100,
      top: (index * 31 + index * 11) % 100,
      delay: (index * 0.2) % 3,
      duration: 3 + (index % 2)
    }));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentRoundIdQuery = useReadContract({
    address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
    abi: guessNumberGameAbi,
    functionName: "currentRoundId",
  });

  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [initialize, isInitialized, isInitializing]);

  const handleCreateRound = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isConnected) {
      toast({ title: "Wallet not connected", description: "Connect a wallet first", variant: "destructive" });
      return;
    }

    if (!isInitialized) {
      toast({
        title: "FHE not ready",
        description: "Wait for FHE encryption to initialize",
        variant: "destructive"
      });
      return;
    }

    const secret = Number(secretNumber);
    if (!Number.isInteger(secret) || secret < 1 || secret > 100) {
      toast({
        title: "Invalid secret number",
        description: "Must be an integer between 1 and 100",
        variant: "destructive"
      });
      return;
    }

    const durationSec = Number(duration);
    if (!Number.isInteger(durationSec) || durationSec < 60) {
      toast({
        title: "Invalid duration",
        description: "Must be at least 60 seconds",
        variant: "destructive"
      });
      return;
    }

    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Encrypt the secret number
      const { handle, inputProof } = await encryptGuess(
        secret,
        CONTRACT_ADDRESSES.GUESS_NUMBER_GAME,
        address
      );

      // Create the round
      // Note: createRound function is not in the current contract ABI
      // This functionality is currently disabled
      toast({
        title: "Feature unavailable",
        description: "Round creation is currently disabled. The contract doesn't support this function.",
        variant: "destructive"
      });
      setIsCreating(false);
      return;

      // const tx = await writeContractAsync({
      //   address: CONTRACT_ADDRESSES.GUESS_NUMBER_GAME as `0x${string}`,
      //   abi: guessNumberGameAbi,
      //   functionName: "createRound",
      //   args: [handle as `0x${string}`, inputProof as `0x${string}`, BigInt(durationSec)],
      //   value: ENTRY_FEE
      // });

      // toast({
      //   title: "Round created!",
      //   description: `Transaction: ${tx.slice(0, 10)}...${tx.slice(-8)}`
      // });

      // // Refetch current round ID
      // await currentRoundIdQuery.refetch();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Creation failed", description: message, variant: "destructive" });
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-playful relative overflow-hidden">
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingCandies.map((item, index) => (
            <div
              key={index}
              className="absolute text-4xl opacity-20 animate-float"
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
                animationDelay: `${item.delay}s`,
                animationDuration: `${item.duration}s`
              }}
            >
              {item.icon}
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm hover:bg-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
            </Button>
          </Link>

          <div className="flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-candy">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-4 w-4 text-blue-500" />
              {isConnected && address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Wallet disconnected"}
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-green-500" />
              {isInitialized ? "FHE ready" : isInitializing ? "Initialising" : "Start FHE"}
            </div>
            {!isInitialized && (
              <Button size="sm" variant="secondary" onClick={() => initialize()} disabled={isInitializing}>
                {isInitializing ? "Initialising…" : "Enable"}
              </Button>
            )}
          </div>
        </div>

        <Card className="max-w-2xl mx-auto p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20 space-y-6">
          <header className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
              🎮 Create New Round
            </h1>
            <p className="text-muted-foreground">
              Anyone can create a game round with an encrypted secret number
            </p>
          </header>

          {!isConnected && (
            <Alert>
              <AlertDescription>Please connect your wallet to create a new round</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Round ID</label>
              <div className="mt-1 p-3 bg-muted rounded-lg font-mono">
                {currentRoundIdQuery.data ? currentRoundIdQuery.data.toString() : "Loading..."}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Contract Address</label>
              <div className="mt-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                {CONTRACT_ADDRESSES.GUESS_NUMBER_GAME}
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateRound} className="space-y-6 pt-6 border-t">
            <div>
              <label className="text-sm font-medium">Secret Number (1-100)</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={secretNumber}
                onChange={(e) => setSecretNumber(e.target.value)}
                placeholder="Enter secret number"
                className="mt-1"
                disabled={isCreating || !isInitialized}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Round Duration (seconds)</label>
              <Input
                type="number"
                min={60}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration in seconds"
                className="mt-1"
                disabled={isCreating || !isInitialized}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(Number(duration) / 60)} minutes
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-xl h-14 bg-gradient-sweet hover:opacity-95 transition-opacity shadow-candy"
              disabled={isCreating || !isInitialized}
            >
              {isCreating ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Creating round...
                </>
              ) : (
                "Create New Round"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Entry fee: 0.001 ETH (will be added to prize pool)
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
