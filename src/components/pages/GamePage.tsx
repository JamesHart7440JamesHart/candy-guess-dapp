'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, Sparkles, Trophy, TrendingDown, TrendingUp, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFHE } from "@/contexts/FHEContext";
import { useGame } from "@/hooks/useGame";
import Confetti from "@/components/Confetti";
import { decryptValue } from "@/lib/fhe";

type GuessHistoryItem = {
  guess: number;
  hint: string;
  timestamp: number;
};

const HINT_MESSAGES: Record<number, string> = {
  0: "🎯 Nailed it! Your encrypted guess matches the secret.",
  1: "🔼 Too high. Try a lower number.",
  2: "🔽 Too low. Edge it upwards.",
  [-1]: "🔐 Hint locked until ACL is ready."
};

interface GamePageProps {
  roundId: number;
}

export default function GamePage({ roundId }: GamePageProps) {
  const { address, isConnected } = useAccount();
  const { isInitialized, isInitializing, initialize } = useFHE();
  const { toast } = useToast();
  const {
    roundInfo,
    playerState,
    revealStatus,
    hasPlayerWon,
    isSubmitting,
    submissionError,
    submitGuess
  } = useGame(roundId);

  const [guess, setGuess] = useState<string>("");
  const [history, setHistory] = useState<GuessHistoryItem[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized && !isInitializing) {
      initialize();
    }
  }, [initialize, isInitialized, isInitializing]);

  useEffect(() => {
    if (hasPlayerWon) {
      setGameWon(true);
    }
  }, [hasPlayerWon]);

  useEffect(() => {
    if (!playerState || !playerState.hasSubmitted) {
      setHintMessage(null);
      return;
    }

    if (!isInitialized) {
      setHintMessage(HINT_MESSAGES[-1]);
      return;
    }

    const encrypted = playerState.encryptedHint;
    if (!encrypted || encrypted === "0x") {
      setHintMessage(null);
      return;
    }

    let cancelled = false;
    decryptValue(encrypted)
      .then((value) => {
        if (cancelled) return;
        const message = HINT_MESSAGES[value as keyof typeof HINT_MESSAGES] ?? HINT_MESSAGES[-1];
        setHintMessage(message);
      })
      .catch(() => {
        if (!cancelled) setHintMessage(HINT_MESSAGES[-1]);
      });

    return () => {
      cancelled = true;
    };
  }, [playerState, isInitialized]);

  useEffect(() => {
    if (!hintMessage || hintMessage === HINT_MESSAGES[-1]) return;
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const [latest, ...rest] = prev;
      return [{ ...latest, hint: hintMessage }, ...rest];
    });
  }, [hintMessage]);

  useEffect(() => {
    if (submissionError) {
      toast({
        title: "Submission failed",
        description: submissionError,
        variant: "destructive"
      });
    }
  }, [submissionError, toast]);

  const roundStatus = useMemo(() => {
    if (!roundInfo) return "Loading…";
    return roundInfo.isActive ? "Active" : "Ended";
  }, [roundInfo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isConnected) {
      toast({ title: "Wallet not connected", description: "Connect a wallet to play", variant: "destructive" });
      return;
    }

    if (!isInitialized) {
      toast({
        title: "FHE not ready",
        description: "Initialise the encryption runtime before guessing",
        variant: "destructive"
      });
      return;
    }

    const numericGuess = Number(guess);
    if (!Number.isInteger(numericGuess) || numericGuess < 1 || numericGuess > 100) {
      toast({
        title: "Invalid guess",
        description: "Pick an integer between 1 and 100",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitGuess(numericGuess);
      setHistory((prev) => [
        {
          guess: numericGuess,
          hint: "Guess submitted! Awaiting encrypted hint…",
          timestamp: Date.now()
        },
        ...prev
      ]);
      toast({
        title: "Guess submitted",
        description: "Your encrypted guess is stored securely on-chain"
      });
      setGuess("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    }
  };

  const revealMessage = useMemo(() => {
    if (!revealStatus) return null;
    if (revealStatus.revealPending) {
      return "Reveal request pending with the gateway";
    }
    if (revealStatus.isRevealed) {
      return `Secret number revealed: ${revealStatus.revealedSecret}`;
    }
    return null;
  }, [revealStatus]);

  return (
    <div className="min-h-screen bg-gradient-playful relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, index) => (
          <div
            key={index}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {"🍬🍭🍡🧁🍩"[index % 5]}
          </div>
        ))}
      </div>

      {gameWon && <Confetti />}

      <div className="container mx-auto px-4 py-8 relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm hover:bg-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to lobby
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

        {submissionError && (
          <Alert variant="destructive">
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20 space-y-8">
            <header className="text-center space-y-3">
              <p className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-accent-foreground">
                Round {roundId} &bull; {roundStatus}
              </p>
              <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent">
                Submit your encrypted guess
              </h1>
              <p className="text-muted-foreground">
                Attempts are private, hints are encrypted, and the secret number only appears once the round closes.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="number"
                min={1}
                max={100}
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                placeholder="Enter your guess (1-100)"
                className="text-center text-2xl h-16 border-2 border-primary/30 focus:border-primary"
                disabled={isSubmitting || !isInitialized || playerState?.hasSubmitted}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full text-xl h-14 bg-gradient-sweet hover:opacity-95 transition-opacity shadow-candy"
                disabled={isSubmitting || !isInitialized || playerState?.hasSubmitted}
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Submitting…
                  </>
                ) : playerState?.hasSubmitted ? (
                  "Guess already submitted"
                ) : (
                  "Submit encrypted guess"
                )}
              </Button>
            </form>

            {hintMessage && (
              <Alert>
                <AlertDescription>{hintMessage}</AlertDescription>
              </Alert>
            )}

            <section>
              <h3 className="text-lg font-semibold mb-4">Your recent guesses</h3>
              {history.length === 0 ? (
                <p className="text-muted-foreground">No guesses yet. Time to take a shot!</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={`${item.guess}-${item.timestamp}`}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                    >
                      <span className="font-bold text-xl">{item.guess}</span>
                      <span className="text-muted-foreground text-sm">{item.hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-candy border-4 border-secondary/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" /> Round stats
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span>Status</span><span>{roundStatus}</span></li>
                <li className="flex justify-between">
                  <span>Total guesses</span>
                  <span>{roundInfo ? roundInfo.totalGuesses : "–"}</span>
                </li>
                <li className="flex justify-between">
                  <span>Start time</span>
                  <span>
                    {roundInfo?.startTime
                      ? new Date(roundInfo.startTime * 1000).toLocaleTimeString()
                      : "–"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>End time</span>
                  <span>
                    {roundInfo?.endTime
                      ? new Date(roundInfo.endTime * 1000).toLocaleTimeString()
                      : "–"}
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-candy border-4 border-success/20 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-success" /> Reveal status
              </h2>
              {revealMessage ? (
                <p className="text-sm text-muted-foreground">{revealMessage}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Reveal requests appear here once the round is closed.
                </p>
              )}
            </Card>

            {!isConnected && (
              <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-candy border-4 border-muted/40 space-y-4">
                <h2 className="text-lg font-semibold">Connect wallet</h2>
                <p className="text-sm text-muted-foreground">
                  Plug in a wallet to submit encrypted guesses and track your private hints.
                </p>
                <ConnectButton />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
