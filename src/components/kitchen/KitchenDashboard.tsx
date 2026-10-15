import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Volume2, VolumeX, QrCode, Sparkles, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { orderStore } from '../../services/orderStore';
import { soundService } from '../../services/soundService';
import { OrderCard } from './OrderCard';
import { CreateOrderModal } from './CreateOrderModal';
import { QRDisplayModal } from './QRDisplayModal';
import { KitchenAnalytics } from './KitchenAnalytics';

interface KitchenDashboardProps {
  onOpenCustomerView: (order: Order) => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({ onOpenCustomerView }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all_active' | 'history'>('all_active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQROrder, setSelectedQROrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = orderStore.subscribeKitchen((updatedOrders) => {
      setOrders(updatedOrders);
    });
    return () => unsubscribe();
  }, []);

  const toggleSound = () => {
    const isMuted = soundService.toggleMute();
    setSoundEnabled(!isMuted);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchTable = order.tableNumber.toString().includes(q);
      const matchCust = order.customerName.toLowerCase().includes(q);
      const matchItem = order.items.some(i => i.name.toLowerCase().includes(q));
      if (!matchNum && !matchTable && !matchCust && !matchItem) return false;
    }

    if (filter === 'all_active') {
      return order.status !== 'served' && order.status !== 'cancelled';
    }
    if (filter === 'history') {
      return order.status === 'served';
    }
    return order.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Kitchen Display System (KDS)
            </h1>
            <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono px-2 py-0.5 rounded font-semibold">
              Live Socket Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-station order dispatch. One-click status triggers instant customer alert on their phone.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSound}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title="Toggle kitchen alert sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Bell On' : 'Bell Muted'}</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Analytics Strip */}
      <KitchenAnalytics orders={orders} />

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setFilter('all_active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'all_active'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Orders ({orders.filter(o => o.status !== 'served').length})
          </button>

          <button
            onClick={() => setFilter('received')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'received'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Received ({orders.filter(o => o.status === 'received').length})
          </button>

          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'preparing'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Preparing ({orders.filter(o => o.status === 'preparing').length})
          </button>

          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'ready'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ready ({orders.filter(o => o.status === 'ready').length})
          </button>

          <button
            onClick={() => setFilter('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'history'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History ({orders.filter(o => o.status === 'served').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search table, item, or ID..."
            className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Grid of Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No Tickets in this View</h3>
          <p className="text-xs text-slate-500 mt-1">All tables are served or no matching query was found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onShowQR={o => setSelectedQROrder(o)}
            />
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOpen && (
        <CreateOrderModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={newOrder => {
            setSelectedQROrder(newOrder);
          }}
        />
      )}

      {/* Table QR Display Modal */}
      {selectedQROrder && (
        <QRDisplayModal
          order={selectedQROrder}
          onClose={() => setSelectedQROrder(null)}
          onOpenCustomerView={order => {
            onOpenCustomerView(order);
          }}
        />
      )}
    </div>
  );
};
