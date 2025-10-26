import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Confetti from "@/components/Confetti";

// Simulated encryption function
const initSDK = (guess: number): string => {
  // In production, this would use fhevmjs to encrypt the guess
  return btoa(`encrypted_${guess}_${Date.now()}`);
};

const Game = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);
  const [history, setHistory] = useState<Array<{ guess: number; hint: string }>>([]);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize game with random number
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const random = Math.floor(Math.random() * 100) + 1;
    setTargetNumber(random);
    setGuess("");
    setAttempts(0);
    setHistory([]);
    setGameWon(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const guessNum = parseInt(guess);
    
    // Validate input
    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      toast({
        title: "Invalid guess! 🍭",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    // Encrypt guess before submission
    setIsEncrypting(true);
    const encryptedGuess = initSDK(guessNum);
    
    // Simulate encryption delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsEncrypting(false);

    console.log("Encrypted guess:", encryptedGuess);

    setAttempts(attempts + 1);

    // Check guess
    if (guessNum === targetNumber) {
      setGameWon(true);
      toast({
        title: "🎉 YOU WIN! 🎉",
        description: `You guessed it in ${attempts + 1} attempts!`,
      });
    } else {
      const hint = guessNum < targetNumber ? "Too low! 📉" : "Too high! 📈";
      setHistory([{ guess: guessNum, hint }, ...history]);
      toast({
        title: hint,
        description: "Try again!",
      });
    }

    setGuess("");
  };

  return (
    <div className="min-h-screen bg-gradient-playful relative overflow-hidden">
      {/* Animated background candies */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {["🍬", "🍭", "🍡", "🧁", "🍩"][i % 5]}
          </div>
        ))}
      </div>

      {gameWon && <Confetti />}

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Link to="/">
          <Button variant="outline" className="mb-8 bg-white/80 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          {!gameWon ? (
            <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-sweet bg-clip-text text-transparent">
                  Guess the Number! 🎯
                </h1>
                <p className="text-muted-foreground text-lg">
                  I'm thinking of a number between 1 and 100
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
                  <Sparkles className="h-4 w-4 text-accent-foreground" />
                  <span className="font-semibold text-accent-foreground">
                    Attempts: {attempts}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Enter your guess..."
                    className="text-center text-2xl h-16 border-2 border-primary/30 focus:border-primary"
                    disabled={isEncrypting}
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-xl h-14 bg-gradient-sweet hover:opacity-90 transition-opacity shadow-candy"
                  disabled={isEncrypting}
                >
                  {isEncrypting ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Encrypting...
                    </>
                  ) : (
                    "Submit Guess 🎲"
                  )}
                </Button>
              </form>

              {/* Guess history */}
              {history.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">Previous Guesses</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-border animate-bounce-in"
                      >
                        <span className="font-bold text-xl">{item.guess}</span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {item.hint.includes("low") ? (
                            <TrendingUp className="h-5 w-5 text-secondary" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          )}
                          {item.hint}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-success text-center animate-bounce-in">
              <Trophy className="h-24 w-24 mx-auto mb-6 text-accent animate-wiggle" />
              <h2 className="text-5xl font-bold mb-4 bg-gradient-playful bg-clip-text text-transparent">
                Congratulations! 🎉
              </h2>
              <p className="text-2xl text-foreground mb-2">
                You guessed the number <span className="font-bold text-primary">{targetNumber}</span>
              </p>
              <p className="text-xl text-muted-foreground mb-8">
                in just {attempts} attempts!
              </p>
              <Button
                size="lg"
                onClick={resetGame}
                className="text-xl px-8 h-14 bg-gradient-sweet hover:opacity-90 transition-opacity shadow-candy"
              >
                Play Again 🔄
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
