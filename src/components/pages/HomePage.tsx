'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useFHE } from "@/contexts/FHEContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Target, Trophy, Zap, Wallet, Shield } from "lucide-react";
import { DEFAULT_ROUND_ID } from "@/lib/wagmi";
import { useState, useEffect, useRef, useMemo } from "react";

const candyIcons = ["🍬", "🍭", "🍡", "🧁", "🍩", "🍪", "🎂", "🍰"];

const sections = [
  {
    step: 1,
    icon: Target,
    title: "Enter Your Guess",
    description: "Pick a number between 1 and 100. Everything is encrypted before it leaves your browser.",
    border: "border-primary/20"
  },
  {
    step: 2,
    icon: Zap,
    title: "Get Instant Hints",
    description: "Encrypted hints let you know whether you are too high or too low without exposing the secret.",
    border: "border-secondary/20"
  },
  {
    step: 3,
    icon: Trophy,
    title: "Win the Round",
    description: "Crack the ciphered number, claim sponsor rewards, and land in the hall of fame.",
    border: "border-accent/20"
  }
];

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isInitialized, isInitializing, initialize } = useFHE();
  const disableWalletKit = process.env.NEXT_PUBLIC_DISABLE_WALLETKIT === "1";
  const [shouldAutoNavigate, setShouldAutoNavigate] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const connectButtonRef = useRef<HTMLDivElement>(null);

  // Generate stable random positions on mount
  const floatingIcons = useMemo(() => {
    return Array.from({ length: 20 }).map((_, index) => ({
      icon: candyIcons[index % candyIcons.length],
      left: (index * 17 + index * index * 3) % 100,
      top: (index * 23 + index * 7) % 100,
      delay: (index * 0.3) % 5,
      duration: 4 + (index % 3)
    }));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-navigate to game when wallet connects (if triggered from Start Playing button)
  useEffect(() => {
    if (shouldAutoNavigate && isConnected && isInitialized) {
      router.push(`/round/${DEFAULT_ROUND_ID}`);
      setShouldAutoNavigate(false);
    }
  }, [isConnected, isInitialized, shouldAutoNavigate, router]);

  // Handle Start Playing button click
  const handleStartPlaying = () => {
    if (disableWalletKit) {
      return; // Do nothing if wallet is disabled
    }

    if (!isConnected) {
      // Trigger wallet connection modal
      setShouldAutoNavigate(true);
      // Programmatically click the ConnectButton
      const connectButton = connectButtonRef.current?.querySelector('button');
      if (connectButton) {
        connectButton.click();
      }
    } else if (!isInitialized && !isInitializing) {
      // Initialize FHE if wallet is connected but FHE is not ready
      initialize();
    } else if (isInitialized) {
      // Navigate to game if both wallet and FHE are ready
      router.push(`/round/${DEFAULT_ROUND_ID}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-candy relative overflow-hidden">
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map((item, index) => (
            <div
              key={index}
              className="absolute text-6xl opacity-30 animate-float"
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

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hidden ConnectButton for programmatic access - Only render on client to avoid hydration mismatch */}
        {isMounted && (
          <div ref={connectButtonRef} className="hidden">
            <ConnectButton />
          </div>
        )}

        {/* Wallet and FHE Status Button - Top Right - Only render on client to avoid hydration mismatch */}
        {isMounted && (
          <div className="absolute top-8 right-8 z-20">
            {disableWalletKit ? (
              <Button disabled className="px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-candy">
                <Wallet className="h-4 w-4 mr-2" />
                Wallet UI disabled
              </Button>
            ) : !isConnected ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-candy">
                <ConnectButton />
              </div>
            ) : (
              <div className="flex items-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-candy">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected"}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold">
                    {isInitialized ? "FHE Ready" : isInitializing ? "Initializing…" : "FHE Not Ready"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-20 animate-bounce-in">
          <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-candy">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
            <span className="font-bold text-primary">Welcome to GuessNumber FHE Game!</span>
          </div>

          <h1
            data-testid="hero-title"
            className="text-7xl md:text-8xl font-black mb-6 bg-gradient-sweet bg-clip-text text-transparent drop-shadow-lg"
          >
            🍭 Guess the Number 🎯
          </h1>

          <p className="text-2xl md:text-3xl text-white font-bold mb-8 drop-shadow-md">
            Stake, strategise, and guess in total privacy.
          </p>

          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
            Every guess is encrypted client-side, verified on-chain, and revealed only when the round ends.
            Master the candy kingdom scoreboard without leaking your secret playbook.
          </p>

          <div className="space-y-4">
            {disableWalletKit ? (
              <Button disabled className="text-2xl px-12 py-8 h-auto bg-white/60 text-primary font-black rounded-2xl border-4 border-primary/30">
                <Wallet className="mr-3 h-8 w-8" />
                Wallet UI disabled
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStartPlaying}
                  disabled={isInitializing}
                  className={`text-2xl px-12 py-8 h-auto font-black rounded-2xl border-4 border-primary/30 transition-transform ${
                    isConnected && isInitialized
                      ? "bg-white text-primary hover:scale-105 shadow-glow"
                      : "bg-white/60 text-primary hover:scale-105"
                  }`}
                >
                  {!isConnected ? (
                    <>
                      <Wallet className="mr-3 h-8 w-8" />
                      Start Playing
                    </>
                  ) : !isInitialized ? (
                    <>
                      <Shield className="mr-3 h-8 w-8" />
                      {isInitializing ? "Initialising FHE…" : "Start Playing"}
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-3 h-8 w-8" />
                      Start Playing
                    </>
                  )}
                </Button>
                <p className="text-sm text-white/80">
                  {!isConnected
                    ? "Click to connect your wallet and start playing"
                    : !isInitialized
                    ? isInitializing
                      ? "Initializing encryption, please wait..."
                      : "Click to initialize FHE encryption"
                    : "Ready to play! Click to enter the game"}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-4xl font-black text-center mb-12 text-white drop-shadow-lg">
            🎲 How to Play
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {sections.map(({ step, icon: Icon, title, description, border }, idx) => (
              <Card
                key={title}
                className={`p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 ${border} hover:scale-105 transition-transform animate-bounce-in`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-sweet text-white text-2xl font-bold">
                    {step}
                  </div>
                  <Icon className="h-12 w-12 mx-auto text-secondary" />
                  <h3 className="text-xl font-bold text-foreground">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8 text-white drop-shadow-lg">✨ Game Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-3 text-primary">🔐 FHE Encrypted Guesses</h3>
              <p className="text-muted-foreground">
                Every guess is encoded with Zama&apos;s relayer SDK before it hits the blockchain. Nothing leaks.
              </p>
            </div>
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-secondary/20">
              <h3 className="text-2xl font-bold mb-3 text-secondary">📊 Smart Hints</h3>
              <p className="text-muted-foreground">
                Compare encrypted guesses with the hidden number and receive privacy-preserving higher/lower signals.
              </p>
            </div>
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-accent/20">
              <h3 className="text-2xl font-bold mb-3 text-accent">🎉 Sponsor Rewards</h3>
              <p className="text-muted-foreground">
                Win badges, seasonal loot, and partner perks when you top the encrypted scoreboard.
              </p>
            </div>
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-success/20">
              <h3 className="text-2xl font-bold mb-3 text-success">🌐 Multi-wallet Ready</h3>
              <p className="text-muted-foreground">
                Seamless support for Rainbow, MetaMask, WalletConnect, Ledger, and Safe. Coinbase is intentionally disabled.
              </p>
            </div>
          </div>
        </div>

        {/* Hall of Fame Section - Only render on client to avoid hydration mismatch */}
        {isMounted && (
          <div className="max-w-4xl mx-auto mt-16 space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-candy">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Encrypted legends forever on-chain</span>
              </div>
              <h2 className="text-4xl font-black text-white drop-shadow-lg">
                🏆 Hall of Fame
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto">
                These trailblazers conquered the guessing arena while guarding their strategies with Zama FHE. Track your
                streaks, unlock sponsor bounties, and aim for the candy crown.
              </p>
            </div>

            <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-primary">
                  <Trophy className="h-6 w-6" /> Season XIV Leaderboard
                </h3>
                <Link href="/admin" className="inline-block">
                  <Button variant="outline" className="text-sm font-semibold">
                    Create New Round
                  </Button>
                </Link>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Player</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Streak</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Avg guesses</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide">Badge</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/90 divide-y divide-border">
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">CandySniper.eth</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">7 wins</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">3</td>
                      <td className="px-6 py-4 text-sm text-accent-foreground">Sweet Oracle</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">MintGuardian</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">5 wins</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">4</td>
                      <td className="px-6 py-4 text-sm text-accent-foreground">Rainbow Runner</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">FHEFanboy</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">4 wins</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">2</td>
                      <td className="px-6 py-4 text-sm text-accent-foreground">Encrypted Ace</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
