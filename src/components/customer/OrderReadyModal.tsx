import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Bell, Volume2, Utensils, CheckCircle, Smartphone, Vibrate } from 'lucide-react';
import { Order } from '../../types/order';
import { soundService } from '../../services/soundService';
import { hapticsService } from '../../services/hapticsService';

interface OrderReadyModalProps {
  order: Order;
  onDismiss: () => void;
}

export const OrderReadyModal: React.FC<OrderReadyModalProps> = ({ order, onDismiss }) => {
  const [isVibratingVisual, setIsVibratingVisual] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    // Fire celebratory confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 }
    });

    // Check Vibration API support
    setVibrationSupported(hapticsService.getIsSupported());
    setVibrationEnabled(hapticsService.getIsEnabled());

    // Trigger Vibration API immediately upon modal mount
    hapticsService.trigger('readyPager');

    // Visual ripple effect synchronized with the pager pulse pattern
    setIsVibratingVisual(true);
    const timer = setTimeout(() => {
      setIsVibratingVisual(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleReplayAlert = () => {
    soundService.playReadyAlertSound();
    hapticsService.trigger('readyPager');
    setIsVibratingVisual(true);
    setTimeout(() => setIsVibratingVisual(false), 2000);
  };

  const handleToggleVibration = () => {
    const nextState = hapticsService.toggle();
    setVibrationEnabled(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400 p-6 shadow-2xl shadow-amber-500/20 text-center relative overflow-hidden animate-in zoom-in-95 duration-200 ${
          isVibratingVisual ? 'ring-4 ring-amber-400/40 ring-offset-2 ring-offset-slate-950 animate-pulse' : ''
        }`}
      >
        {/* Glow backdrop ring */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Cloche / Ready Bell Icon with Pulsing Halo */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Utensils className="w-10 h-10 text-slate-950" />
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-400 items-center justify-center text-[10px] font-bold text-slate-950">🔔</span>
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>Your Order is Ready!</span>
          <span>🍕</span>
        </h2>

        {/* Table & Order Identification */}
        <div className="mt-3 py-2 px-4 rounded-xl bg-slate-950 border border-slate-800 inline-flex items-center gap-2 text-xs">
          <span className="font-bold text-amber-400">Table {order.tableNumber}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-300">{order.orderNumber}</span>
        </div>

        {/* Haptic Vibration Status Pill */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
            <Smartphone className="w-3.5 h-3.5 animate-bounce" />
            <span>
              {vibrationSupported
                ? (vibrationEnabled ? 'Mobile Haptic Pager Active' : 'Haptics Muted')
                : 'Haptic Alert Active'}
            </span>
          </div>

          <button
            onClick={handleToggleVibration}
            className="text-[10px] text-slate-400 hover:text-white underline"
          >
            {vibrationEnabled ? 'Mute Haptics' : 'Enable Haptics'}
          </button>
        </div>

        {/* Delivery / Pickup Message */}
        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          The kitchen has just finished plating your dishes hot and fresh. A food runner is on the way to your table or you may collect from the counter!
        </p>

        {/* Ordered items quick recap */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-left text-xs max-h-28 overflow-y-auto space-y-1.5">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-300">
              <span className="truncate pr-2">
                <strong className="text-amber-400 mr-1.5">{it.quantity}x</strong>
                {it.name}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold shrink-0">Ready</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <button
            onClick={onDismiss}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <CheckCircle className="w-5 h-5 text-slate-950" />
            <span>Got It — Ready to Feast!</span>
          </button>

          <button
            onClick={handleReplayAlert}
            className="w-full h-10 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Replay Chime & Haptic Buzz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
