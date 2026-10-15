import React, { useState, useEffect } from 'react';
import { X, Gift, Check, Copy, Tag, Calendar, Sparkles } from 'lucide-react';
import { RewardCoupon } from '../../types/order';
import { orderStore } from '../../services/orderStore';

interface RewardWalletDrawerProps {
  onClose: () => void;
}

export const RewardWalletDrawer: React.FC<RewardWalletDrawerProps> = ({ onClose }) => {
  const [coupons, setCoupons] = useState<RewardCoupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCoupons(orderStore.getRewardCoupons());
  }, []);

  const handleCopy = (coupon: RewardCoupon) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleMarkUsed = (couponId: string) => {
    orderStore.markCouponUsed(couponId);
    setCoupons(orderStore.getRewardCoupons());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Your Reward Wallet</h2>
              <p className="text-[11px] text-slate-400">Discount coupons won while waiting</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close wallet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {coupons.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No vouchers yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">Spin the Rewards Wheel in the game lobby to win!</p>
            </div>
          ) : (
            coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`relative rounded-2xl border p-4 transition-all ${
                  coupon.isUsed
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    : 'bg-slate-950/90 border-amber-500/30 hover:border-amber-400/50 shadow-md'
                }`}
              >
                {/* Coupon badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {coupon.discount}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">
                      {coupon.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{coupon.expiresAt}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {coupon.description}
                </p>

                {/* Promo Code Box */}
                <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-xs font-bold tracking-wider text-slate-100">
                      {coupon.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(coupon)}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20"
                  >
                    {copiedId === coupon.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Redeem Toggle */}
                {!coupon.isUsed ? (
                  <div className="mt-2.5 flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">Show to server at checkout</span>
                    <button
                      onClick={() => handleMarkUsed(coupon.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                    >
                      Mark as Redeemed
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-right">
                    <span className="text-[10px] text-slate-500 font-medium">✓ Already Redeemed</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Coupons can be applied to your active dining bill or next visit.
        </div>
      </div>
    </div>
  );
};
