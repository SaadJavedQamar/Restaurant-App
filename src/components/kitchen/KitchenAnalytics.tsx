import React from 'react';
import { ChefHat, Bell, CheckCircle2, Clock, Flame } from 'lucide-react';
import { Order } from '../../types/order';

interface KitchenAnalyticsProps {
  orders: Order[];
}

export const KitchenAnalytics: React.FC<KitchenAnalyticsProps> = ({ orders }) => {
  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const servedOrders = orders.filter(o => o.status === 'served');

  // Calculate average wait time for completed or active orders
  const validTimes = orders.map(o => {
    const end = o.servedAt || o.readyAt || Date.now();
    return (end - o.createdAt) / (1000 * 60);
  });
  const avgWait = validTimes.length > 0
    ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1)
    : '12.0';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Active Tickets</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
            {activeOrders.length}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
          <ChefHat className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">In Prep</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
            {preparingOrders.length}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Ready at Pass</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
            {readyOrders.length}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Served Today</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
            {servedOrders.length}
          </span>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium block">Avg Wait Time</span>
          <span className="text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
            {avgWait}m
          </span>
        </div>
      </div>
    </div>
  );
};
