import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, X, KeyRound } from 'lucide-react';

interface StaffAuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === '1234' || pin === '0000') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('Invalid PIN. Use default staff code: 1234');
    }
  };

  const handleQuickDemoAccess = () => {
    setError('');
    setPin('');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white">Staff & Kitchen Login</h3>
        <p className="text-xs text-slate-400 mt-1">
          Authorized kitchen personnel access to live KDS, status dispatch, and ticket controls.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-left">
              Kitchen Security PIN (Default: 1234)
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="••••"
              className="w-full h-11 text-center font-mono text-xl tracking-widest rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>Access Kitchen KDS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <button
            onClick={handleQuickDemoAccess}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1-Click Demo Staff Unlock</span>
          </button>
        </div>
      </div>
    </div>
  );
};
