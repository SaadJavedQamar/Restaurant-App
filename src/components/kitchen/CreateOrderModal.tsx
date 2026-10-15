import React, { useState } from 'react';
import { X, Plus, Trash2, Utensils, Check } from 'lucide-react';
import { orderStore } from '../../services/orderStore';
import { OrderItem, Order } from '../../types/order';

interface CreateOrderModalProps {
  onClose: () => void;
  onCreated: (order: Order) => void;
}

const PRESET_ITEMS = [
  { name: 'Smash Angus Cheeseburger', price: 16.50, category: 'mains' as const },
  { name: 'Woodfired Truffle Margherita Pizza', price: 19.00, category: 'mains' as const },
  { name: 'Crispy Fried Chicken Katsu', price: 15.00, category: 'mains' as const },
  { name: 'Parmesan Truffle Fries', price: 8.50, category: 'sides' as const },
  { name: 'Burrata & Heirloom Salad', price: 13.50, category: 'sides' as const },
  { name: 'Molten Chocolate Lava Cake', price: 10.50, category: 'desserts' as const },
  { name: 'Sparkling Berry Botanical Mocktail', price: 6.50, category: 'beverages' as const },
  { name: 'Double Shot Espresso', price: 4.50, category: 'beverages' as const },
];

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onCreated }) => {
  const [tableNumber, setTableNumber] = useState('5');
  const [customerName, setCustomerName] = useState('Sarah Miller');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([
    { id: 'it-1', name: 'Smash Angus Cheeseburger', quantity: 1, price: 16.50, category: 'mains', notes: 'No onions' },
    { id: 'it-2', name: 'Parmesan Truffle Fries', quantity: 1, price: 8.50, category: 'sides' }
  ]);
  const [kitchenNotes, setKitchenNotes] = useState('Guest requested table near window');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = (preset: typeof PRESET_ITEMS[0]) => {
    const existingIndex = selectedItems.findIndex(i => i.name === preset.name);
    if (existingIndex > -1) {
      const copy = [...selectedItems];
      copy[existingIndex].quantity += 1;
      setSelectedItems(copy);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: preset.name,
          quantity: 1,
          price: preset.price,
          category: preset.category
        }
      ]);
    }
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    const copy = [...selectedItems];
    const newQty = copy[index].quantity + delta;
    if (newQty <= 0) {
      removeItem(index);
    } else {
      copy[index].quantity = newQty;
      setSelectedItems(copy);
    }
  };

  const updateNotes = (index: number, notes: string) => {
    const copy = [...selectedItems];
    copy[index].notes = notes;
    setSelectedItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber || selectedItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const created = await orderStore.createOrder({
      tableNumber: parseInt(tableNumber, 10),
      customerName: customerName.trim() || `Guest Table ${tableNumber}`,
      items: selectedItems,
      kitchenNotes
    });
    setIsSubmitting(false);

    if (created) {
      onCreated(created);
      onClose();
    }
  };

  const subtotal = selectedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Kitchen Order Ticket</h2>
              <p className="text-[11px] text-slate-400">Broadcasts live to KDS and enables customer game tracking</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Table & Guest */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Table Number *</label>
              <input
                type="number"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer / Party Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick-add preset item chips */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Quick-Add Menu Items:</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ITEMS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => addItem(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-400 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Items List */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Order Items ({selectedItems.length})
            </label>
            {selectedItems.length === 0 ? (
              <p className="text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                Click items above to add to this ticket.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 tabular-nums">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-mono"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-white w-4 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-mono"
                        >
                          +
                        </button>
                      </div>

                      {/* Special instructions */}
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={e => updateNotes(idx, e.target.value)}
                        placeholder="Add note (e.g. extra spicy)"
                        className="h-6 px-2 text-[10px] rounded bg-slate-900 border border-slate-800 text-slate-300 focus:border-amber-400 focus:outline-none w-48"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kitchen Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Kitchen & Allergy Notes</label>
            <input
              type="text"
              value={kitchenNotes}
              onChange={e => setKitchenNotes(e.target.value)}
              placeholder="e.g. Nut allergy, express rush order"
              className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Subtotal preview */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-semibold">
            <span className="text-slate-400">Total Bill Estimate</span>
            <span className="font-mono text-sm text-amber-400 tabular-nums">
              ${(subtotal * 1.09).toFixed(2)}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={selectedItems.length === 0 || isSubmitting}
            className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              selectedItems.length === 0 || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Send Order to Kitchen Display</span>
          </button>
        </form>
      </div>
    </div>
  );
};
