'use client';

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";

const champions = [
  {
    player: "CandySniper.eth",
    streak: 7,
    avgGuesses: 3,
    badge: "Sweet Oracle"
  },
  {
    player: "MintGuardian",
    streak: 5,
    avgGuesses: 4,
    badge: "Rainbow Runner"
  },
  {
    player: "FHEFanboy",
    streak: 4,
    avgGuesses: 2,
    badge: "Encrypted Ace"
  }
];

export default function HallOfFamePage() {
  return (
    <div className="min-h-screen bg-gradient-candy relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            key={index}
            className="absolute text-5xl opacity-25 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          >
            {"🍬🍭🍡🧁🍩"[index % 5]}
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-candy">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Encrypted legends forever on-chain</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-sweet bg-clip-text text-transparent drop-shadow">
            Hall of Fame
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            These trailblazers conquered the guessing arena while guarding their strategies with Zama FHE. Track your
            streaks, unlock sponsor bounties, and aim for the candy crown.
          </p>
        </header>

        <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
              <Trophy className="h-6 w-6" /> Season XIV leaderboard
            </h2>
            <Link href="/">
              <Button variant="outline">Back to lobby</Button>
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
                {champions.map((entry) => (
                  <tr key={entry.player}>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{entry.player}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.streak} wins</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.avgGuesses}</td>
                    <td className="px-6 py-4 text-sm text-accent-foreground">{entry.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
