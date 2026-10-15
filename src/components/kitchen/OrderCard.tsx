import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, Bell, Check, QrCode, AlertCircle, Sparkles } from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { orderStore } from '../../services/orderStore';
import { soundService } from '../../services/soundService';

interface OrderCardProps {
  order: Order;
  onShowQR: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onShowQR }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const calc = () => {
      const now = order.servedAt || Date.now();
      const diff = Math.max(0, Math.floor((now - order.createdAt) / 1000));
      setElapsedSeconds(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.servedAt]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    setIsUpdating(true);
    if (nextStatus === 'ready') {
      soundService.playReadyAlertSound();
    } else {
      soundService.playStatusUpdateSound();
    }
    await orderStore.updateOrderStatus(order.id, nextStatus);
    setIsUpdating(false);
  };

  // Urgency styling based on wait time
  const isUrgent = order.status !== 'served' && elapsedSeconds > 20 * 60; // > 20 mins
  const isWarning = order.status !== 'served' && elapsedSeconds > 12 * 60 && !isUrgent; // 12-20 mins

  return (
    <div
      className={`rounded-2xl border flex flex-col justify-between transition-all shadow-md ${
        order.status === 'ready'
          ? 'bg-slate-900 border-amber-400 ring-1 ring-amber-400/30'
          : order.status === 'served'
          ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
          : isUrgent
          ? 'bg-red-950/20 border-red-500/50'
          : isWarning
          ? 'bg-amber-950/15 border-amber-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-3.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">Table {order.tableNumber}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="font-mono text-xs font-semibold text-slate-400">{order.orderNumber}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShowQR(order)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Show Table QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                order.status === 'ready'
                  ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                  : order.status === 'preparing'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : order.status === 'served'
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Guest & Elapsed Time */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400 truncate max-w-[130px]">{order.customerName}</span>
          <div
            className={`flex items-center gap-1 font-mono font-bold tabular-nums text-xs ${
              isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatElapsed(elapsedSeconds)}</span>
            {isUrgent && <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-0.5" />}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3.5 flex-1 space-y-2 text-xs">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex items-start justify-between">
            <div>
              <div className="text-slate-100 font-medium leading-snug">
                <span className="font-mono font-bold text-amber-400 mr-1.5">{it.quantity}x</span>
                <span>{it.name}</span>
              </div>
              {it.notes && (
                <p className="text-[11px] text-amber-300/80 italic pl-5 mt-0.5 font-sans">
                  ★ {it.notes}
                </p>
              )}
            </div>
            <span className="font-mono text-slate-400 text-[11px] shrink-0 tabular-nums">
              ${(it.price * it.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        {order.kitchenNotes && (
          <div className="mt-2.5 rounded-lg bg-slate-950 border border-slate-800 p-2 text-[11px] text-slate-300">
            <span className="text-amber-400 font-semibold mr-1">Note:</span>
            {order.kitchenNotes}
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80">
        {order.status === 'received' && (
          <button
            onClick={() => handleStatusChange('preparing')}
            disabled={isUpdating}
            className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors active:scale-95"
          >
            <ChefHat className="w-4 h-4" />
            <span>Start Preparing</span>
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            onClick={() => handleStatusChange('ready')}
            disabled={isUpdating}
            className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>Mark Ready (Alert Customer 🔔)</span>
          </button>
        )}

        {order.status === 'ready' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('served')}
              disabled={isUpdating}
              className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Served / Delivered</span>
            </button>
            <button
              onClick={() => handleStatusChange('preparing')}
              disabled={isUpdating}
              className="px-3 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              title="Return to preparing"
            >
              Undo
            </button>
          </div>
        )}

        {order.status === 'served' && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Delivered · Completed</span>
            <button
              onClick={() => handleStatusChange('ready')}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Reopen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
