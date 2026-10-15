import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface KitchenMemoryProps {
  onBack: () => void;
  isOrderReady?: boolean;
}

interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  name: string;
}

const CARDS_DATA = [
  { pairId: 1, emoji: '🍕', name: 'Pizza' },
  { pairId: 2, emoji: '🍔', name: 'Cheeseburger' },
  { pairId: 3, emoji: '🥐', name: 'Croissant' },
  { pairId: 4, emoji: '🍣', name: 'Nigiri' },
  { pairId: 5, emoji: '☕', name: 'Espresso' },
  { pairId: 6, emoji: '🧁', name: 'Cupcake' }
];

export const KitchenMemoryGame: React.FC<KitchenMemoryProps> = ({ onBack, isOrderReady }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const deck: CardItem[] = [];
    CARDS_DATA.forEach((item, idx) => {
      deck.push({ id: idx * 2, pairId: item.pairId, emoji: item.emoji, name: item.name });
      deck.push({ id: idx * 2 + 1, pairId: item.pairId, emoji: item.emoji, name: item.name });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setFlippedIds([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (card: CardItem) => {
    if (
      isOrderReady ||
      flippedIds.length === 2 ||
      flippedIds.includes(card.id) ||
      matchedPairs.includes(card.pairId)
    ) {
      return;
    }

    soundService.playWheelTickSound();
    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const card1 = cards.find(c => c.id === newFlipped[0])!;
      const card2 = cards.find(c => c.id === newFlipped[1])!;

      if (card1.pairId === card2.pairId) {
        soundService.playEatSound();
        const nextMatched = [...matchedPairs, card1.pairId];
        setMatchedPairs(nextMatched);
        setFlippedIds([]);

        if (nextMatched.length === CARDS_DATA.length) {
          setIsWon(true);
          soundService.playVictorySound();
        }
      } else {
        setTimeout(() => {
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Moves: <strong className="text-amber-400 tabular-nums">{moves}</strong></span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Matched: <strong className="text-emerald-400 tabular-nums">{matchedPairs.length}</strong> / 6</span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="flex-1 flex items-center justify-center py-2">
        {!isWon ? (
          <div className="grid grid-cols-3 gap-2.5 w-72">
            {cards.map(card => {
              const isFlipped = flippedIds.includes(card.id) || matchedPairs.includes(card.pairId);
              const isMatched = matchedPairs.includes(card.pairId);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={isFlipped || isOrderReady}
                  className={`h-22 rounded-2xl border text-3xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
                    isMatched
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : isFlipped
                      ? 'bg-slate-800 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-700'
                  }`}
                >
                  {isFlipped ? (
                    <span className="animate-in zoom-in-75">{card.emoji}</span>
                  ) : (
                    <Sparkles className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">Full Kitchen Matched!</h3>
            <p className="text-xs text-slate-400 mt-1">Completed in <strong className="text-amber-400">{moves}</strong> moves.</p>
            <button
              onClick={initGame}
              className="mt-4 flex items-center gap-2 px-6 py-2.5 mx-auto rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-lg transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Reset */}
      {!isWon && (
        <div className="pt-3">
          <button
            onClick={initGame}
            className="w-full h-11 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Shuffle & Restart</span>
          </button>
        </div>
      )}
    </div>
  );
};
