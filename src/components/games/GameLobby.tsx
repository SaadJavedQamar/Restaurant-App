import React, { useState } from 'react';
import { Gift, Play, Sparkles, Trophy, Brain, Gamepad2, ArrowRight } from 'lucide-react';
import { MiniGameId } from '../../types/order';
import { SpinTheWheelGame } from './SpinTheWheelGame';
import { SnakeGame } from './SnakeGame';
import { TicTacToeGame } from './TicTacToeGame';
import { FoodTriviaGame } from './FoodTriviaGame';
import { KitchenMemoryGame } from './KitchenMemoryGame';

interface GameLobbyProps {
  onOpenWallet: () => void;
  isOrderReady?: boolean;
}

interface GameCardConfig {
  id: MiniGameId;
  title: string;
  category: string;
  badge?: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
}

const GAMES_LIST: GameCardConfig[] = [
  {
    id: 'wheel',
    title: 'Spin for Rewards',
    category: 'Vouchers & Prizes',
    badge: 'Win Discounts',
    description: 'Spin to win 5%–10% discount codes, free desserts, and drink vouchers while waiting!',
    icon: <Gift className="w-5 h-5 text-amber-400" />,
    duration: 'Instant'
  },
  {
    id: 'snake',
    title: 'Foodie Snake',
    category: 'Arcade Classic',
    description: 'Guide the hungry snake to gobble burgers, truffle pizzas, and tacos without crashing.',
    icon: <Gamepad2 className="w-5 h-5 text-emerald-400" />,
    duration: '2–3 min'
  },
  {
    id: 'tictactoe',
    title: "Chef's Tic-Tac-Toe",
    category: 'Table Strategy',
    description: 'Challenge the restaurant Sous Chef AI bot in a fast-paced game of kitchen tactics.',
    icon: <Trophy className="w-5 h-5 text-sky-400" />,
    duration: '1 min'
  },
  {
    id: 'trivia',
    title: 'Gourmet Food Trivia',
    category: 'Culinary Quiz',
    description: 'Test your gastronomic knowledge with fun kitchen facts, speed streaks, and secrets.',
    icon: <Brain className="w-5 h-5 text-purple-400" />,
    duration: '2 min'
  },
  {
    id: 'memory',
    title: 'Kitchen Match',
    category: 'Memory Cards',
    description: 'Flip and match gourmet dish pairs in record moves before your appetizer lands.',
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
    duration: '1–2 min'
  }
];

export const GameLobby: React.FC<GameLobbyProps> = ({ onOpenWallet, isOrderReady }) => {
  const [activeGame, setActiveGame] = useState<MiniGameId | null>(null);

  if (activeGame === 'wheel') {
    return <SpinTheWheelGame onBack={() => setActiveGame(null)} onOpenWallet={onOpenWallet} isOrderReady={isOrderReady} />;
  }
  if (activeGame === 'snake') {
    return <SnakeGame onBack={() => setActiveGame(null)} isOrderReady={isOrderReady} />;
  }
  if (activeGame === 'tictactoe') {
    return <TicTacToeGame onBack={() => setActiveGame(null)} isOrderReady={isOrderReady} />;
  }
  if (activeGame === 'trivia') {
    return <FoodTriviaGame onBack={() => setActiveGame(null)} isOrderReady={isOrderReady} />;
  }
  if (activeGame === 'memory') {
    return <KitchenMemoryGame onBack={() => setActiveGame(null)} isOrderReady={isOrderReady} />;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>While You Wait</span>
            <span className="text-[11px] font-normal text-slate-400">· Mini-Games Lounge</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Games pause automatically the moment your food is ready.</p>
        </div>
      </div>

      {/* Featured Wheel Banner */}
      <div
        onClick={() => setActiveGame('wheel')}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border border-amber-500/30 p-4 transition-all hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.99]"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400">
              <Gift className="w-3.5 h-3.5" />
              <span>Rewards Wheel</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">Win Discounts</span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              Spin to Win Vouchers & Treats
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Take a spin while the kitchen prepares your dishes. Win coupon discounts on future visits or instant dessert treats!
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {GAMES_LIST.filter(g => g.id !== 'wheel').map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className="group flex flex-col text-left rounded-2xl bg-slate-900/80 border border-slate-800/80 p-3.5 hover:border-slate-700 hover:bg-slate-900 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                {game.icon}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span>{game.duration}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              {game.title}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {game.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
