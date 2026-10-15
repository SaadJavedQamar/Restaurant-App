import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Clock, Utensils, Sparkles } from 'lucide-react';
import { MenuItem, Order } from '../../types/order';
import { orderStore } from '../../services/orderStore';
import { soundService } from '../../services/soundService';

interface DigitalMenuModalProps {
  order: Order | null;
  onClose: () => void;
}

export const DigitalMenuModal: React.FC<DigitalMenuModalProps> = ({ order, onClose }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'desserts' | 'sides' | 'beverages'>('all');
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch menu items from store or API
    const items = orderStore.getMenuItems();
    if (items.length > 0) {
      setMenuItems(items);
    } else {
      fetch('/api/menu')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d.items)) setMenuItems(d.items);
        })
        .catch(() => {});
    }
  }, []);

  const handleAddItem = async (item: MenuItem) => {
    if (!order || isSubmitting) return;

    setIsSubmitting(true);
    soundService.playEatSound();

    const updated = await orderStore.addItemsToActiveOrder([item]);
    setIsSubmitting(false);

    if (updated) {
      setAddedItemIds(prev => new Set(prev).add(item.id));
      setTimeout(() => {
        setAddedItemIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 2500);
    }
  };

  const filteredItems = activeTab === 'all'
    ? menuItems
    : menuItems.filter(i => i.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Waiting Menu Preview</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Craving Desserts or Extra Drinks?
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'desserts', 'sides', 'beverages'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Treats' : tab}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.map(item => {
            const isAdded = addedItemIds.has(item.id);

            return (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                {/* Item Thumbnail with fallback */}
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback container
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Utensils className="w-6 h-6 text-slate-600" />
                  )}
                  {item.badge && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-white leading-snug">
                        {item.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-amber-400 shrink-0 tabular-nums">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.prepTime}</span>
                    </span>

                    {order ? (
                      <button
                        onClick={() => handleAddItem(item)}
                        disabled={isSubmitting}
                        className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm active:scale-95'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Ticket!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Table {order.tableNumber}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Track order to add</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Items ordered are sent instantly to the kitchen display screen.
        </div>
      </div>
    </div>
  );
};
