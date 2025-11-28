'use client';

import { useEffect, useState } from "react";

// Confetti celebration component
const Confetti = () => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: string; color: string; delay: string }>>([]);

  useEffect(() => {
    // Generate 50 confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: ["#ec4899", "#fbbf24", "#a78bfa", "#34d399", "#f59e0b"][Math.floor(Math.random() * 5)],
      delay: `${Math.random() * 2}s`,
    }));
    setConfettiPieces(pieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
