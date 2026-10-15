export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: 'mains' | 'sides' | 'desserts' | 'beverages';
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  estimatedPrepTimeMinutes: number;
  readyAt?: number;
  servedAt?: number;
  kitchenNotes?: string;
  discountsApplied?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'desserts' | 'sides' | 'beverages';
  price: number;
  description: string;
  prepTime: string;
  image?: string;
  badge?: string;
}

export interface RewardCoupon {
  id: string;
  code: string;
  title: string;
  discount: string;
  description: string;
  expiresAt: string;
  isUsed: boolean;
  wonAt: number;
}

export type MiniGameId = 'wheel' | 'snake' | 'tictactoe' | 'trivia' | 'memory';
