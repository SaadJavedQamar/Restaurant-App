import React, { useState } from 'react';
import { Search, QrCode, Utensils, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { orderStore } from '../../services/orderStore';
import { Order } from '../../types/order';

interface OrderSetupScreenProps {
  onOrderFound: (order: Order) => void;
}

export const OrderSetupScreen: React.FC<OrderSetupScreenProps> = ({ onOrderFound }) => {
  const [orderQuery, setOrderQuery] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQRScannerSim, setShowQRScannerSim] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderQuery.trim() && !tableNumber.trim()) {
      setErrorMessage('Please enter an Order ID or Table Number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const found = await orderStore.trackByCredentials(
      orderQuery.trim() || tableNumber.trim(),
      tableNumber ? parseInt(tableNumber, 10) : undefined
    );

    setIsLoading(false);

    if (found) {
      onOrderFound(found);
    } else {
      setErrorMessage(`No active order found for ${orderQuery || `Table ${tableNumber}`}. Try one of the demo tables below!`);
    }
  };

  const selectDemoOrder = async (orderId: string, table: number) => {
    setIsLoading(true);
    setErrorMessage('');
    const found = await orderStore.trackByCredentials(orderId, table);
    setIsLoading(false);
    if (found) {
      onOrderFound(found);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col justify-between min-h-[calc(100vh-140px)]">
      <div>
        {/* Welcome Hero Lockup */}
        <div className="pt-2 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-lg shadow-amber-500/5">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Track Your Table Order</h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Enter your receipt token or table number to track cooking progress live and play waiting games.
          </p>
        </div>

        {/* Input Form Card */}
        <form onSubmit={handleTrack} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Order Token / Receipt ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="e.g. ORD-101 or 101"
                className="w-full h-11 px-3.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors uppercase font-mono"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dining Table Number
            </label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 4 or 7"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
            >
              <span>{isLoading ? 'Locating Order...' : 'Track Live Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowQRScannerSim(true)}
              className="h-11 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
              title="Simulate Table QR Code Scan"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>
        </form>

        {/* Demo Quick-Pick Cards */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Select an Active Table Order:</span>
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => selectDemoOrder('ord-101', 4)}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Table 4</span>
                  <span className="text-[11px] text-slate-500">·</span>
                  <span className="text-[11px] font-mono text-slate-400">#ORD-101</span>
                  <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">Preparing ⏳</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">2x Smash Angus Burger, Truffle Fries, Mocktails</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => selectDemoOrder('ord-102', 7)}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Table 7</span>
                  <span className="text-[11px] text-slate-500">·</span>
                  <span className="text-[11px] font-mono text-slate-400">#ORD-102</span>
                  <span className="text-[11px] text-sky-400/90 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded">Received 📋</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Woodfired Truffle Pizza, Burrata Salad, Italian Soda</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => selectDemoOrder('ord-103', 12)}
              className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Table 12</span>
                  <span className="text-[11px] text-slate-500">·</span>
                  <span className="text-[11px] font-mono text-slate-400">#ORD-103</span>
                  <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready 🔔</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Sea Scallops, Wild Mushroom Risotto, Lava Cake</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Frictionless Footer Note */}
      <div className="pt-6 pb-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>No customer account or login required · Instant session</span>
      </div>

      {/* QR Scanner Simulation Modal */}
      {showQRScannerSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white">Simulated Table QR Scanner</h3>
            <p className="mt-1 text-xs text-slate-300">
              In real dining, customers scan the QR sticker on Table 4. Select a demo scan:
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setShowQRScannerSim(false);
                  selectDemoOrder('ord-101', 4);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Scan Table 4 (Angus Burger Prep)
              </button>
              <button
                onClick={() => {
                  setShowQRScannerSim(false);
                  selectDemoOrder('ord-102', 7);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Scan Table 7 (Woodfired Pizza)
              </button>
            </div>

            <button
              onClick={() => setShowQRScannerSim(false)}
              className="mt-4 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
