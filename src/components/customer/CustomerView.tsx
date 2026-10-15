import React, { useState, useEffect } from 'react';
import { Order } from '../../types/order';
import { orderStore } from '../../services/orderStore';
import { OrderSetupScreen } from './OrderSetupScreen';
import { LiveStatusBar } from './LiveStatusBar';
import { GameLobby } from '../games/GameLobby';
import { OrderReadyModal } from './OrderReadyModal';
import { DigitalMenuModal } from './DigitalMenuModal';
import { RewardWalletDrawer } from './RewardWalletDrawer';
import { hapticsService } from '../../services/hapticsService';

export const CustomerView: React.FC = () => {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [readyAlertOrder, setReadyAlertOrder] = useState<Order | null>(null);
  const [isDigitalMenuOpen, setIsDigitalMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  useEffect(() => {
    // Subscribe to active order updates
    const unsubscribeOrder = orderStore.subscribeOrder((order) => {
      setActiveOrder(order);
      // If order is ready and alert modal is not yet shown, show it
      if (order?.status === 'ready' && !readyAlertOrder) {
        hapticsService.trigger('readyPager');
        setReadyAlertOrder(order);
      }
    });

    // Subscribe to explicit instant ready alert
    const unsubscribeReady = orderStore.subscribeReadyAlert((readyOrder) => {
      hapticsService.trigger('readyPager');
      setReadyAlertOrder(readyOrder);
    });

    return () => {
      unsubscribeOrder();
      unsubscribeReady();
    };
  }, [readyAlertOrder]);

  const handleOrderFound = (order: Order) => {
    orderStore.setActiveOrder(order);
    if (order.status === 'ready') {
      setReadyAlertOrder(order);
    }
  };

  const handleSwitchOrder = () => {
    orderStore.setActiveOrder(null);
  };

  return (
    <div className="min-h-full pb-16">
      {!activeOrder ? (
        <OrderSetupScreen onOrderFound={handleOrderFound} />
      ) : (
        <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4">
          {/* Top Live Progress Bar */}
          <LiveStatusBar
            order={activeOrder}
            onOpenDigitalMenu={() => setIsDigitalMenuOpen(true)}
            onSwitchOrder={handleSwitchOrder}
          />

          {/* Embedded Mini-Games Lobby */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-3 sm:p-4">
            <GameLobby
              onOpenWallet={() => setIsWalletOpen(true)}
              isOrderReady={activeOrder.status === 'ready'}
            />
          </div>
        </div>
      )}

      {/* Real-time Full-Screen Ready Alert Modal */}
      {readyAlertOrder && (
        <OrderReadyModal
          order={readyAlertOrder}
          onDismiss={() => setReadyAlertOrder(null)}
        />
      )}

      {/* Digital Menu Preview Modal */}
      {isDigitalMenuOpen && (
        <DigitalMenuModal
          order={activeOrder}
          onClose={() => setIsDigitalMenuOpen(false)}
        />
      )}

      {/* Reward Wallet Drawer */}
      {isWalletOpen && (
        <RewardWalletDrawer
          onClose={() => setIsWalletOpen(false)}
        />
      )}
    </div>
  );
};
