import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import { Order } from '../../types/order';

interface QRDisplayModalProps {
  order: Order;
  onClose: () => void;
  onOpenCustomerView: (order: Order) => void;
}

export const QRDisplayModal: React.FC<QRDisplayModalProps> = ({ order, onClose, onOpenCustomerView }) => {
  const [copied, setCopied] = useState(false);

  // In production or preview, direct URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const customerUrl = `${origin}/?order=${order.orderNumber}&table=${order.tableNumber}`;

  const copyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(customerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
          <QrCode className="w-4 h-4" />
          <span>Dining Table QR Pass</span>
        </div>
        <h3 className="text-xl font-bold text-white">Table {order.tableNumber}</h3>
        <p className="text-xs font-mono text-slate-400 mt-0.5">{order.orderNumber} · {order.customerName}</p>

        {/* Clean SVG QR Code Representation */}
        <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-xl mx-auto border-4 border-amber-400">
          <svg viewBox="0 0 160 160" className="w-44 h-44">
            {/* Corner position markers */}
            <rect x="10" y="10" width="40" height="40" fill="#0f172a" rx="4" />
            <rect x="18" y="18" width="24" height="24" fill="#ffffff" rx="2" />
            <rect x="24" y="24" width="12" height="12" fill="#0f172a" rx="1" />

            <rect x="110" y="10" width="40" height="40" fill="#0f172a" rx="4" />
            <rect x="118" y="18" width="24" height="24" fill="#ffffff" rx="2" />
            <rect x="124" y="24" width="12" height="12" fill="#0f172a" rx="1" />

            <rect x="10" y="110" width="40" height="40" fill="#0f172a" rx="4" />
            <rect x="18" y="118" width="24" height="24" fill="#ffffff" rx="2" />
            <rect x="24" y="124" width="12" height="12" fill="#0f172a" rx="1" />

            {/* Simulated Data Matrix Modules */}
            <rect x="60" y="15" width="8" height="8" fill="#0f172a" />
            <rect x="75" y="15" width="8" height="8" fill="#0f172a" />
            <rect x="90" y="25" width="8" height="8" fill="#0f172a" />
            <rect x="60" y="35" width="8" height="8" fill="#0f172a" />
            <rect x="80" y="45" width="8" height="8" fill="#0f172a" />

            <rect x="15" y="60" width="8" height="8" fill="#0f172a" />
            <rect x="25" y="75" width="8" height="8" fill="#0f172a" />
            <rect x="35" y="90" width="8" height="8" fill="#0f172a" />
            <rect x="45" y="60" width="8" height="8" fill="#0f172a" />

            {/* Center icon: burger cloche */}
            <circle cx="80" cy="80" r="18" fill="#f59e0b" />
            <circle cx="80" cy="80" r="14" fill="#0f172a" />
            <rect x="72" y="77" width="16" height="6" rx="2" fill="#f59e0b" />

            {/* Additional data modules */}
            <rect x="110" y="65" width="8" height="8" fill="#0f172a" />
            <rect x="125" y="75" width="8" height="8" fill="#0f172a" />
            <rect x="140" y="65" width="8" height="8" fill="#0f172a" />
            <rect x="115" y="90" width="8" height="8" fill="#0f172a" />

            <rect x="65" y="115" width="8" height="8" fill="#0f172a" />
            <rect x="80" y="125" width="8" height="8" fill="#0f172a" />
            <rect x="95" y="115" width="8" height="8" fill="#0f172a" />
            <rect x="120" y="120" width="8" height="8" fill="#0f172a" />
            <rect x="135" y="135" width="8" height="8" fill="#0f172a" />
          </svg>
        </div>

        <p className="text-xs text-slate-300">
          Customer scans this QR code at Table {order.tableNumber} to instantly track cooking status and play mini-games.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenCustomerView(order);
            }}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Customer Tracker View</span>
          </button>

          <button
            onClick={copyLink}
            className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Direct Customer Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
