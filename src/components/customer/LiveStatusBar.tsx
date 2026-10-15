import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, Utensils, ChevronDown, ChevronUp, Bell, Sparkles, Smartphone, Vibrate } from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { hapticsService } from '../../services/hapticsService';

interface LiveStatusBarProps {
  order: Order;
  onOpenDigitalMenu: () => void;
  onSwitchOrder: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'received', label: 'Received', icon: <Utensils className="w-4 h-4" /> },
  { key: 'preparing', label: 'Preparing', icon: <ChefHat className="w-4 h-4" /> },
  { key: 'ready', label: 'Ready for You', icon: <Bell className="w-4 h-4" /> },
  { key: 'served', label: 'Served', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export const LiveStatusBar: React.FC<LiveStatusBarProps> = ({ order, onOpenDigitalMenu, onSwitchOrder }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hapticNotice, setHapticNotice] = useState(false);

  useEffect(() => {
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - order.createdAt) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'received': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'served': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);
  const estimatedSeconds = order.estimatedPrepTimeMinutes * 60;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100));

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Top Header Strip */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Table {order.tableNumber}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-slate-400 font-semibold">{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDigitalMenu}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Items</span>
            </button>
            <button
              onClick={onSwitchOrder}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* 4-Step Progress Track */}
        <div className="mt-4 pt-1">
          <div className="grid grid-cols-4 gap-1 relative">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;

              let iconColor = 'text-slate-600 bg-slate-800/80 border-slate-700';
              let textColor = 'text-slate-500';

              if (isPast) {
                iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                textColor = 'text-emerald-400';
              } else if (isCurrent) {
                if (order.status === 'ready') {
                  iconColor = 'text-amber-300 bg-amber-500/30 border-amber-400 animate-pulse';
                  textColor = 'text-amber-300 font-bold';
                } else {
                  iconColor = 'text-amber-400 bg-amber-500/20 border-amber-400/60 ring-2 ring-amber-400/20';
                  textColor = 'text-amber-400 font-semibold';
                }
              }

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${iconColor}`}>
                    {step.icon}
                  </div>
                  <span className={`text-[10px] tracking-tight mt-1.5 transition-colors ${textColor}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                order.status === 'ready'
                  ? 'bg-emerald-400 animate-pulse'
                  : order.status === 'served'
                  ? 'bg-emerald-500'
                  : 'bg-amber-400'
              }`}
              style={{
                width:
                  order.status === 'ready' || order.status === 'served'
                    ? '100%'
                    : `${Math.max(15, (currentIndex / 3) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Live Wait Timing & Kitchen Status */}
        <div className="mt-3.5 flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Waiting Time:</span>
            <span className="font-mono font-bold text-white tabular-nums">{formatElapsed(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                hapticsService.trigger('readyPager');
                setHapticNotice(true);
                setTimeout(() => setHapticNotice(false), 2000);
              }}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              title="Test mobile vibration alert pattern"
            >
              <Smartphone className={`w-3 h-3 ${hapticNotice ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{hapticNotice ? 'Vibrating...' : 'Test Vibration'}</span>
            </button>

            <div className="text-[11px] text-slate-400">
              {order.status === 'ready' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Hot & Plated!
                </span>
              ) : order.status === 'served' ? (
                <span className="text-slate-300 font-medium">Delivered</span>
              ) : (
                <span>~{order.estimatedPrepTimeMinutes}m</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Order Ticket Details */}
      <div className="px-4 py-2 bg-slate-950/50">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>{order.items.length} items ordered (${order.total.toFixed(2)})</span>
          <div className="flex items-center gap-1">
            <span>{isDetailsOpen ? 'Hide Receipt' : 'View Receipt'}</span>
            {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {isDetailsOpen && (
          <div className="mt-2.5 pb-2 pt-1 border-t border-slate-800/80 space-y-2 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div>
                  <div className="text-slate-200 font-medium">
                    <span className="text-amber-400 font-mono font-bold mr-1.5">{item.quantity}x</span>
                    <span>{item.name}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-slate-400 italic pl-5 mt-0.5">{item.notes}</p>
                  )}
                </div>
                <span className="font-mono text-slate-300 tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            {order.kitchenNotes && (
              <div className="mt-2 rounded-lg bg-slate-900 border border-slate-800 p-2 text-[11px] text-slate-400">
                <strong className="text-amber-400 block mb-0.5">Kitchen Memo:</strong>
                {order.kitchenNotes}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-white">
              <span>Total Paid</span>
              <span className="font-mono text-amber-400 tabular-nums">${order.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
