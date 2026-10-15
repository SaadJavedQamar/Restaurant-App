import React, { useState, useEffect } from 'react';
import { Utensils, ChefHat, Gift, Sparkles, Smartphone, LayoutDashboard, QrCode } from 'lucide-react';
import { CustomerView } from './components/customer/CustomerView';
import { KitchenDashboard } from './components/kitchen/KitchenDashboard';
import { StaffAuthModal } from './components/kitchen/StaffAuthModal';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { RewardWalletDrawer } from './components/customer/RewardWalletDrawer';
import { DigitalMenuModal } from './components/customer/DigitalMenuModal';
import { orderStore } from './services/orderStore';
import { Order } from './types/order';

export default function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'kitchen'>('customer');
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [isStaffAuthModalOpen, setIsStaffAuthModalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDigitalMenuOpen, setIsDigitalMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Subscribe to active order
  useEffect(() => {
    const unsub = orderStore.subscribeOrder((ord) => {
      setActiveOrder(ord);
    });
    return () => unsub();
  }, []);

  // Parse URL query parameters e.g. ?order=ORD-101&table=4 or ?view=kitchen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const orderParam = params.get('order');
    const tableParam = params.get('table');

    if (viewParam === 'kitchen') {
      setIsStaffAuthenticated(true);
      setActiveTab('kitchen');
    }

    if (orderParam || tableParam) {
      orderStore.trackByCredentials(orderParam || '', tableParam ? parseInt(tableParam, 10) : undefined);
    }
  }, []);

  const handleKitchenTabClick = () => {
    if (!isStaffAuthenticated) {
      setIsStaffAuthModalOpen(true);
    } else {
      setActiveTab('kitchen');
    }
  };

  const handleOpenCustomerView = (order: Order) => {
    orderStore.setActiveOrder(order);
    setActiveTab('customer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Universal 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('customer');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Utensils className="w-4 h-4 fill-current" />
          </div>
          <span className="font-display">BistroPulse</span>
        </a>

        {/* Zone 2: Navigation Links (Single-Line, whitespace-nowrap) */}
        <nav className="flex items-center gap-1 sm:gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
              activeTab === 'customer'
                ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer Tracker</span>
            {activeOrder && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={handleKitchenTabClick}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
              activeTab === 'kitchen'
                ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Display (KDS)</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            title="Rewards Wallet"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Vouchers</span>
          </button>

          <PWAInstallButton />
        </div>
      </header>

      {/* Main App Content */}
      <main className="flex-1">
        {activeTab === 'customer' ? (
          <CustomerView />
        ) : (
          <KitchenDashboard onOpenCustomerView={handleOpenCustomerView} />
        )}
      </main>

      {/* Global Staff Auth Modal */}
      <StaffAuthModal
        isOpen={isStaffAuthModalOpen}
        onSuccess={() => {
          setIsStaffAuthenticated(true);
          setIsStaffAuthModalOpen(false);
          setActiveTab('kitchen');
        }}
        onClose={() => setIsStaffAuthModalOpen(false)}
      />

      {/* Global Reward Wallet Modal */}
      {isWalletOpen && (
        <RewardWalletDrawer onClose={() => setIsWalletOpen(false)} />
      )}

      {/* Global Digital Menu Modal */}
      {isDigitalMenuOpen && (
        <DigitalMenuModal
          order={activeOrder}
          onClose={() => setIsDigitalMenuOpen(false)}
        />
      )}

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
