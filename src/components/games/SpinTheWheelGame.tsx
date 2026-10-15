import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift, RotateCcw, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { soundService } from '../../services/soundService';
import { orderStore } from '../../services/orderStore';
import { RewardCoupon } from '../../types/order';

interface WheelSlice {
  label: string;
  shortLabel: string;
  color: string;
  textColor: string;
  discount: string;
  codePrefix: string;
}

const SLICES: WheelSlice[] = [
  { label: '5% Off Next Visit', shortLabel: '5% OFF', color: '#f59e0b', textColor: '#0f172a', discount: '5% OFF', codePrefix: 'PULSE5' },
  { label: 'Free Soft Drink', shortLabel: 'FREE DRINK', color: '#0ea5e9', textColor: '#ffffff', discount: 'FREE DRINK', codePrefix: 'DRINK' },
  { label: '10% VIP Pass', shortLabel: '10% VIP', color: '#10b981', textColor: '#ffffff', discount: '10% OFF', codePrefix: 'VIP10' },
  { label: 'Free Lava Cake', shortLabel: 'FREE CAKE', color: '#ec4899', textColor: '#ffffff', discount: 'FREE DESSERT', codePrefix: 'CAKE' },
  { label: 'Chef Secret Dip', shortLabel: 'SECRET DIP', color: '#8b5cf6', textColor: '#ffffff', discount: 'FREE DIP', codePrefix: 'CHEFDIP' },
  { label: 'Free Truffle Fries', shortLabel: 'FREE FRIES', color: '#f97316', textColor: '#ffffff', discount: 'FREE SIDES', codePrefix: 'FRIES' },
  { label: 'Free Cookie Treat', shortLabel: 'COOKIE', color: '#eab308', textColor: '#0f172a', discount: 'FREE COOKIE', codePrefix: 'COOKIE' },
  { label: '$3 Off Bill', shortLabel: '$3 OFF', color: '#06b6d4', textColor: '#ffffff', discount: '$3 OFF', codePrefix: 'SAVE3' }
];

interface SpinTheWheelGameProps {
  onBack: () => void;
  onOpenWallet: () => void;
  isOrderReady?: boolean;
}

export const SpinTheWheelGame: React.FC<SpinTheWheelGameProps> = ({ onBack, onOpenWallet, isOrderReady }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<RewardCoupon | null>(null);
  const [spinsLeft, setSpinsLeft] = useState<number>(3);
  const wheelRef = useRef<HTMLDivElement>(null);

  // If order becomes ready while spinning, pause
  useEffect(() => {
    if (isOrderReady && isSpinning) {
      setIsSpinning(false);
    }
  }, [isOrderReady, isSpinning]);

  const spinWheel = () => {
    if (isSpinning || spinsLeft <= 0 || isOrderReady) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Pick a random winning slice
    const sliceCount = SLICES.length;
    const sliceAngle = 360 / sliceCount;
    const winningIndex = Math.floor(Math.random() * sliceCount);

    // Calculate target angle (add 5-7 full spins)
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    // Pin at top (270 degrees or 90 depending on arrow position)
    // Pointer is at the top (angle 270 relative to standard coordinate, or 0 at top)
    const targetOffset = 360 - (winningIndex * sliceAngle + sliceAngle / 2);
    const currentBase = rotation - (rotation % 360);
    const finalRotation = currentBase + (360 * extraRounds) + targetOffset;

    setRotation(finalRotation);

    // Tick sounds during rotation
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundService.playWheelTickSound();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 150);

    // Spin animation duration matches transition (3.8 seconds)
    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setSpinsLeft(prev => Math.max(0, prev - 1));

      const prize = SLICES[winningIndex];
      const randomCode = `${prize.codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCoupon: RewardCoupon = {
        id: `coup-${Date.now()}`,
        code: randomCode,
        title: prize.label,
        discount: prize.discount,
        description: `Won during your wait! Present coupon to server or redeem at checkout.`,
        expiresAt: 'Valid for 14 days',
        isUsed: false,
        wonAt: Date.now()
      };

      setWonPrize(newCoupon);
      orderStore.addRewardCoupon(newCoupon);
      soundService.playVictorySound();

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 3800);
  };

  const sliceAngle = 360 / SLICES.length;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Game Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Spins: <strong className="text-amber-400 tabular-nums">{spinsLeft}</strong></span>
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>
        </div>
      </div>

      {/* Wheel Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative py-2">
        {/* Pointer Arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-md" />

        {/* Outer Wheel Rim */}
        <div className="relative w-72 h-72 rounded-full p-2 bg-gradient-to-b from-slate-800 to-slate-950 border-4 border-amber-500/30 shadow-2xl shadow-amber-500/10 flex items-center justify-center">
          {/* Inner Spinning Wheel */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full relative overflow-hidden transition-transform duration-[3800ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: 'cubic-bezier(0.15, 0.99, 0.25, 1)'
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {SLICES.map((slice, idx) => {
                const startAngle = idx * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);

                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);

                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                // Center point for label
                const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                const textX = 50 + 32 * Math.cos(midRad);
                const textY = 50 + 32 * Math.sin(midRad);
                const textRot = (startAngle + endAngle) / 2;

                return (
                  <g key={idx}>
                    <path d={pathData} fill={slice.color} stroke="#0f172a" strokeWidth="0.8" />
                    <text
                      x={textX}
                      y={textY}
                      fill={slice.textColor}
                      fontSize="4.2"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRot + 90}, ${textX}, ${textY})`}
                    >
                      {slice.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900 border-4 border-amber-400 shadow-lg flex items-center justify-center z-10">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Won Prize Banner */}
        {wonPrize && (
          <div className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 p-3.5 text-center shadow-lg">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>You Won: {wonPrize.title}!</span>
            </div>
            <div className="mt-1 font-mono text-sm tracking-wider font-bold text-white bg-slate-950/60 rounded px-2 py-1 inline-block border border-amber-500/30">
              {wonPrize.code}
            </div>
            <p className="mt-1 text-[11px] text-slate-300">Saved directly to your Reward Wallet!</p>
          </div>
        )}
      </div>

      {/* Spin Controls */}
      <div className="pt-3">
        <button
          onClick={spinWheel}
          disabled={isSpinning || spinsLeft <= 0}
          className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] ${
            isSpinning || spinsLeft <= 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
          }`}
        >
          <RotateCcw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Spinning Wheel...' : spinsLeft > 0 ? `Spin for Reward (${spinsLeft} Left)` : 'No Spins Remaining Today'}</span>
        </button>
      </div>
    </div>
  );
};
