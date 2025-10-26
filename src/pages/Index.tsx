import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Sparkles, Target, Trophy, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-candy relative overflow-hidden">
      {/* Floating candy decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            {["🍬", "🍭", "🍡", "🧁", "🍩", "🍪", "🎂", "🍰"][i % 8]}
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-bounce-in">
          <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-candy">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
            <span className="font-bold text-primary">Welcome to GuessNumber!</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-6 animate-wiggle bg-gradient-sweet bg-clip-text text-transparent drop-shadow-lg">
            🍭 Guess the Number 🎯
          </h1>
          
          <p className="text-2xl md:text-3xl text-white font-bold mb-8 drop-shadow-md">
            A sweet & playful number guessing game!
          </p>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
            Test your luck and intuition! Guess the secret number between 1-100, 
            get instant hints, and win with the fewest attempts. 
            Your guesses are encrypted before submission! 🔐
          </p>

          <Link to="/game">
            <Button 
              size="lg" 
              className="text-2xl px-12 py-8 h-auto bg-white text-primary hover:scale-110 transition-transform shadow-glow font-black rounded-2xl border-4 border-primary/30"
            >
              <Trophy className="mr-3 h-8 w-8" />
              Start Playing! 🎮
            </Button>
          </Link>
        </div>

        {/* How to Play Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-4xl font-black text-center mb-12 text-white drop-shadow-lg">
            🎲 How to Play
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-primary/20 hover:scale-105 transition-transform animate-bounce-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-sweet text-white mb-4 text-2xl font-bold">
                  1
                </div>
                <Target className="h-12 w-12 mx-auto mb-4 text-secondary" />
                <h3 className="text-xl font-bold mb-3 text-foreground">Enter Your Guess</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Type any number between 1 and 100. Your input is encrypted before submission!
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-secondary/20 hover:scale-105 transition-transform animate-bounce-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-sweet text-white mb-4 text-2xl font-bold">
                  2
                </div>
                <Zap className="h-12 w-12 mx-auto mb-4 text-accent" />
                <h3 className="text-xl font-bold mb-3 text-foreground">Get Instant Hints</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive "Too High" or "Too Low" feedback after each guess to guide you!
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-candy border-4 border-accent/20 hover:scale-105 transition-transform animate-bounce-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-sweet text-white mb-4 text-2xl font-bold">
                  3
                </div>
                <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3 text-foreground">Win the Game!</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Guess correctly and celebrate with confetti! Try to win in the fewest attempts!
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8 text-white drop-shadow-lg">
            ✨ Game Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-3 text-primary">🔐 Encrypted Guesses</h3>
              <p className="text-muted-foreground">
                Your guesses are encrypted using initSDK before submission, ensuring privacy and security
              </p>
            </div>
            
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-secondary/20">
              <h3 className="text-2xl font-bold mb-3 text-secondary">📊 Smart Hints</h3>
              <p className="text-muted-foreground">
                Get real-time feedback with "Too High" or "Too Low" hints to guide your strategy
              </p>
            </div>
            
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-accent/20">
              <h3 className="text-2xl font-bold mb-3 text-accent">🎉 Victory Celebration</h3>
              <p className="text-muted-foreground">
                Win the game and enjoy an animated confetti celebration with your score
              </p>
            </div>
            
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-candy border-2 border-success/20">
              <h3 className="text-2xl font-bold mb-3 text-success">🎨 Playful Design</h3>
              <p className="text-muted-foreground">
                Enjoy a candy-themed, colorful interface with smooth animations throughout
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 animate-pulse-glow">
          <Link to="/game">
            <Button 
              size="lg" 
              className="text-xl px-10 py-6 h-auto bg-accent text-accent-foreground hover:scale-110 transition-transform shadow-glow font-bold rounded-xl"
            >
              Ready to Play? Let's Go! 🚀
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
