import { Order, OrderStatus, RewardCoupon, MenuItem } from '../types/order';
import { soundService } from './soundService';
import { hapticsService } from './hapticsService';

type OrderListener = (order: Order | null) => void;
type KitchenOrdersListener = (orders: Order[]) => void;
type ReadyAlertListener = (order: Order) => void;

class OrderStore {
  private activeOrder: Order | null = null;
  private kitchenOrders: Order[] = [];
  private menuItems: MenuItem[] = [];
  private orderListeners: Set<OrderListener> = new Set();
  private kitchenListeners: Set<KitchenOrdersListener> = new Set();
  private readyAlertListeners: Set<ReadyAlertListener> = new Set();

  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private savedCoupons: RewardCoupon[] = [];

  constructor() {
    this.loadFromStorage();
    this.initBroadcastChannel();
    this.initSSE();
    this.fetchInitialData();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedActive = localStorage.getItem('bistropulse_active_order');
      if (savedActive) {
        this.activeOrder = JSON.parse(savedActive);
      }
      const savedCoupons = localStorage.getItem('bistropulse_coupons');
      if (savedCoupons) {
        this.savedCoupons = JSON.parse(savedCoupons);
      } else {
        // Pre-seed a welcome coupon
        this.savedCoupons = [
          {
            id: 'coup-welcome',
            code: 'BISTRO10',
            title: 'Welcome 10% Off',
            discount: '10% OFF',
            description: '10% discount on your next restaurant dining experience',
            expiresAt: 'Valid for 30 days',
            isUsed: false,
            wonAt: Date.now()
          }
        ];
        this.saveCouponsToStorage();
      }
    } catch {
      // Ignore storage parse errors
    }
  }

  private saveActiveOrderToStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (this.activeOrder) {
        localStorage.setItem('bistropulse_active_order', JSON.stringify(this.activeOrder));
      } else {
        localStorage.removeItem('bistropulse_active_order');
      }
    } catch {}
  }

  private saveCouponsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bistropulse_coupons', JSON.stringify(this.savedCoupons));
    } catch {}
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      this.broadcastChannel = new BroadcastChannel('bistropulse_sync');
      this.broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data || {};
        if (type === 'order:updated' && data) {
          this.handleOrderUpdated(data, false);
        } else if (type === 'order:created' && data) {
          this.handleOrderCreated(data, false);
        } else if (type === 'order:ready' && data) {
          this.handleOrderReady(data, false);
        }
      };
    } catch {
      // Fallback
    }
  }

  private initSSE() {
    if (typeof window === 'undefined') return;
    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.addEventListener('connected', () => {
        this.isConnected = true;
      });

      this.eventSource.addEventListener('order:created', (e: MessageEvent) => {
        try {
          const newOrder: Order = JSON.parse(e.data);
          this.handleOrderCreated(newOrder, true);
        } catch {}
      });

      this.eventSource.addEventListener('order:updated', (e: MessageEvent) => {
        try {
          const updatedOrder: Order = JSON.parse(e.data);
          this.handleOrderUpdated(updatedOrder, true);
        } catch {}
      });

      this.eventSource.addEventListener('order:ready', (e: MessageEvent) => {
        try {
          const readyOrder: Order = JSON.parse(e.data);
          this.handleOrderReady(readyOrder, true);
        } catch {}
      });

      this.eventSource.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      // Offline or network error
    }
  }

  private async fetchInitialData() {
    try {
      const [ordersRes, menuRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/menu').catch(() => null)
      ]);

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data.orders)) {
          this.kitchenOrders = data.orders;
          this.notifyKitchenListeners();

          // Sync active order if present
          if (this.activeOrder) {
            const synced = data.orders.find((o: Order) => o.id === this.activeOrder?.id || o.orderNumber === this.activeOrder?.orderNumber);
            if (synced) {
              this.activeOrder = synced;
              this.saveActiveOrderToStorage();
              this.notifyOrderListeners();
            }
          }
        }
      }

      if (menuRes && menuRes.ok) {
        const data = await menuRes.json();
        if (Array.isArray(data.items)) {
          this.menuItems = data.items;
        }
      }
    } catch {
      // Offline fallback
    }
  }

  private handleOrderCreated(order: Order, broadcastLocally: boolean) {
    const exists = this.kitchenOrders.some(o => o.id === order.id);
    if (!exists) {
      this.kitchenOrders = [order, ...this.kitchenOrders];
      this.notifyKitchenListeners();
    }

    if (broadcastLocally && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'order:created', data: order });
    }
  }

  private handleOrderUpdated(order: Order, broadcastLocally: boolean) {
    // Update in kitchen list
    this.kitchenOrders = this.kitchenOrders.map(o => o.id === order.id ? order : o);
    this.notifyKitchenListeners();

    // Check if this matches our active customer order
    if (this.activeOrder && (this.activeOrder.id === order.id || this.activeOrder.orderNumber === order.orderNumber)) {
      const prevStatus = this.activeOrder.status;
      this.activeOrder = order;
      this.saveActiveOrderToStorage();
      this.notifyOrderListeners();

      if (order.status === 'ready' && prevStatus !== 'ready') {
        this.handleOrderReady(order, broadcastLocally);
      }
    }

    if (broadcastLocally && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'order:updated', data: order });
    }
  }

  private handleOrderReady(order: Order, broadcastLocally: boolean) {
    if (this.activeOrder && (this.activeOrder.id === order.id || this.activeOrder.orderNumber === order.orderNumber)) {
      soundService.playReadyAlertSound();
      hapticsService.trigger('readyPager');

      for (const listener of this.readyAlertListeners) {
        listener(order);
      }
    }

    if (broadcastLocally && this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'order:ready', data: order });
    }
  }

  // Customer Actions
  public setActiveOrder(order: Order | null) {
    this.activeOrder = order;
    this.saveActiveOrderToStorage();
    this.notifyOrderListeners();
  }

  public getActiveOrder(): Order | null {
    return this.activeOrder;
  }

  public async trackByCredentials(orderQuery: string, tableNumber?: number): Promise<Order | null> {
    const q = orderQuery.trim().toLowerCase();
    
    // Check locally first
    let match = this.kitchenOrders.find(o => 
      o.orderNumber.toLowerCase() === q || 
      o.id.toLowerCase() === q || 
      (tableNumber && o.tableNumber === tableNumber && o.status !== 'served')
    );

    if (!match) {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          match = data.order;
        }
      } catch {}
    }

    if (match) {
      this.setActiveOrder(match);
      return match;
    }

    return null;
  }

  // Kitchen Actions
  public async updateOrderStatus(orderId: string, status: OrderStatus, kitchenNotes?: string): Promise<Order | null> {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, kitchenNotes })
      });
      if (res.ok) {
        const data = await res.json();
        this.handleOrderUpdated(data.order, true);
        return data.order;
      }
    } catch {
      // Fallback local update
      const existing = this.kitchenOrders.find(o => o.id === orderId);
      if (existing) {
        existing.status = status;
        existing.updatedAt = Date.now();
        if (status === 'ready') existing.readyAt = Date.now();
        if (status === 'served') existing.servedAt = Date.now();
        this.handleOrderUpdated(existing, true);
        return existing;
      }
    }
    return null;
  }

  public async createOrder(orderData: Partial<Order>): Promise<Order | null> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const data = await res.json();
        this.handleOrderCreated(data.order, true);
        return data.order;
      }
    } catch {}
    return null;
  }

  public async addItemsToActiveOrder(items: MenuItem[]): Promise<Order | null> {
    if (!this.activeOrder) return null;
    const mappedItems = items.map(m => ({
      id: m.id,
      name: m.name,
      quantity: 1,
      price: m.price,
      category: m.category
    }));

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(this.activeOrder.id)}/add-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mappedItems })
      });
      if (res.ok) {
        const data = await res.json();
        this.handleOrderUpdated(data.order, true);
        return data.order;
      }
    } catch {}

    return null;
  }

  // Rewards & Wallet
  public addRewardCoupon(coupon: RewardCoupon) {
    this.savedCoupons = [coupon, ...this.savedCoupons];
    this.saveCouponsToStorage();
  }

  public getRewardCoupons(): RewardCoupon[] {
    return this.savedCoupons;
  }

  public markCouponUsed(couponId: string) {
    this.savedCoupons = this.savedCoupons.map(c => c.id === couponId ? { ...c, isUsed: true } : c);
    this.saveCouponsToStorage();
  }

  public getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  public getKitchenOrders(): Order[] {
    return this.kitchenOrders;
  }

  // Subscriptions
  public subscribeOrder(listener: OrderListener): () => void {
    this.orderListeners.add(listener);
    listener(this.activeOrder);
    return () => this.orderListeners.delete(listener);
  }

  public subscribeKitchen(listener: KitchenOrdersListener): () => void {
    this.kitchenListeners.add(listener);
    listener(this.kitchenOrders);
    return () => this.kitchenListeners.delete(listener);
  }

  public subscribeReadyAlert(listener: ReadyAlertListener): () => void {
    this.readyAlertListeners.add(listener);
    return () => this.readyAlertListeners.delete(listener);
  }

  private notifyOrderListeners() {
    for (const listener of this.orderListeners) {
      listener(this.activeOrder);
    }
  }

  private notifyKitchenListeners() {
    for (const listener of this.kitchenListeners) {
      listener(this.kitchenOrders);
    }
  }
}

export const orderStore = new OrderStore();
