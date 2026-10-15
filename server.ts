import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Order Data Types
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

// Initial In-Memory Seed Orders
const orders: Map<string, Order> = new Map();

const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-101',
    tableNumber: 4,
    customerName: 'Marcus Vance',
    status: 'preparing',
    items: [
      { id: 'item-1', name: 'Smash Angus Cheeseburger', quantity: 2, price: 16.50, category: 'mains', notes: 'Medium rare, extra pickles' },
      { id: 'item-2', name: 'Parmesan Truffle Fries', quantity: 1, price: 8.50, category: 'sides', notes: 'Rosemary garlic aioli on the side' },
      { id: 'item-3', name: 'Sparkling Berry Mocktail', quantity: 2, price: 6.00, category: 'beverages' }
    ],
    subtotal: 53.50,
    tax: 4.82,
    total: 58.32,
    createdAt: Date.now() - 1000 * 60 * 9, // 9 mins ago
    updatedAt: Date.now() - 1000 * 60 * 7,
    estimatedPrepTimeMinutes: 15,
    kitchenNotes: 'Party celebrating birthday at Table 4'
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-102',
    tableNumber: 7,
    customerName: 'Elena Rostova',
    status: 'received',
    items: [
      { id: 'item-4', name: 'Woodfired Truffle Margherita Pizza', quantity: 1, price: 19.00, category: 'mains' },
      { id: 'item-5', name: 'Burrata & Heirloom Salad', quantity: 1, price: 13.50, category: 'sides', notes: 'Dressing on the side' },
      { id: 'item-6', name: 'Fresh Italian Soda', quantity: 1, price: 5.50, category: 'beverages' }
    ],
    subtotal: 38.00,
    tax: 3.42,
    total: 41.42,
    createdAt: Date.now() - 1000 * 60 * 3, // 3 mins ago
    updatedAt: Date.now() - 1000 * 60 * 3,
    estimatedPrepTimeMinutes: 18,
    kitchenNotes: 'Table 7 requested extra napkins'
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-103',
    tableNumber: 12,
    customerName: 'David Chen',
    status: 'ready',
    items: [
      { id: 'item-7', name: 'Pan-Seared Sea Scallops', quantity: 1, price: 24.00, category: 'mains' },
      { id: 'item-8', name: 'Wild Mushroom Risotto', quantity: 1, price: 21.00, category: 'mains' },
      { id: 'item-9', name: 'Molten Chocolate Lava Cake', quantity: 1, price: 10.50, category: 'desserts' }
    ],
    subtotal: 55.50,
    tax: 5.00,
    total: 60.50,
    createdAt: Date.now() - 1000 * 60 * 18, // 18 mins ago
    updatedAt: Date.now() - 1000 * 60 * 1,
    readyAt: Date.now() - 1000 * 60 * 1,
    estimatedPrepTimeMinutes: 16,
    kitchenNotes: 'Plated hot at the Chef pass. Ready for runner pickup!'
  },
  {
    id: 'ord-104',
    orderNumber: 'ORD-104',
    tableNumber: 2,
    customerName: 'Chloe Bennett',
    status: 'served',
    items: [
      { id: 'item-10', name: 'Crispy Fried Chicken Katsu Sandwich', quantity: 1, price: 15.00, category: 'mains' },
      { id: 'item-11', name: 'Sweet Potato Waffle Fries', quantity: 1, price: 7.00, category: 'sides' }
    ],
    subtotal: 22.00,
    tax: 1.98,
    total: 23.98,
    createdAt: Date.now() - 1000 * 60 * 42,
    updatedAt: Date.now() - 1000 * 60 * 20,
    readyAt: Date.now() - 1000 * 60 * 24,
    servedAt: Date.now() - 1000 * 60 * 20,
    estimatedPrepTimeMinutes: 15,
    kitchenNotes: 'Customer left compliment to the chef!'
  }
];

initialOrders.forEach(o => orders.set(o.id.toLowerCase(), o));

// SSE Client Connections
const sseClients = new Set<Response>();

function broadcastSSE(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep SSE alive with periodic heartbeat ping
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// API Endpoints
// Real-time SSE Stream
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Get all orders
app.get('/api/orders', (req: Request, res: Response) => {
  const orderList = Array.from(orders.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ orders: orderList });
});

// Get single order
app.get('/api/orders/:id', (req: Request, res: Response) => {
  const id = req.params.id.toLowerCase();
  const order = orders.get(id) || Array.from(orders.values()).find(
    o => o.orderNumber.toLowerCase() === id || (o.tableNumber.toString() === id && o.status !== 'served')
  );

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ order });
});

// Create new order (Kitchen staff or QR checkout)
app.post('/api/orders', (req: Request, res: Response) => {
  const { tableNumber, customerName, items, kitchenNotes } = req.body;
  if (!tableNumber) {
    res.status(400).json({ error: 'Table number is required' });
    return;
  }

  const count = orders.size + 101;
  const id = `ord-${count}`;
  const orderNumber = `ORD-${count}`;

  const validItems: OrderItem[] = Array.isArray(items) && items.length > 0 ? items : [
    { id: 'item-demo-1', name: 'Chef Special Plate', quantity: 1, price: 18.00, category: 'mains' },
    { id: 'item-demo-2', name: 'Crispy Truffle Fries', quantity: 1, price: 8.50, category: 'sides' }
  ];

  const subtotal = validItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const tax = Number((subtotal * 0.09).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const newOrder: Order = {
    id,
    orderNumber,
    tableNumber: parseInt(tableNumber, 10) || 1,
    customerName: customerName || `Guest Table ${tableNumber}`,
    status: 'received',
    items: validItems,
    subtotal,
    tax,
    total,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    estimatedPrepTimeMinutes: 15,
    kitchenNotes: kitchenNotes || ''
  };

  orders.set(id, newOrder);
  broadcastSSE('order:created', newOrder);

  res.status(201).json({ order: newOrder });
});

// Update order status (Kitchen Staff)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const id = req.params.id.toLowerCase();
  const { status, kitchenNotes } = req.body;

  const order = orders.get(id) || Array.from(orders.values()).find(o => o.orderNumber.toLowerCase() === id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const validStatuses: OrderStatus[] = ['received', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  order.status = status;
  order.updatedAt = Date.now();
  if (kitchenNotes !== undefined) {
    order.kitchenNotes = kitchenNotes;
  }

  if (status === 'ready' && !order.readyAt) {
    order.readyAt = Date.now();
    // Dispatch instant Ready alert event!
    broadcastSSE('order:ready', order);
  } else if (status === 'served' && !order.servedAt) {
    order.servedAt = Date.now();
  }

  orders.set(order.id.toLowerCase(), order);
  broadcastSSE('order:updated', order);

  res.json({ order });
});

// Add items to order (Customer Digital Menu add-ons while waiting)
app.post('/api/orders/:id/add-items', (req: Request, res: Response) => {
  const id = req.params.id.toLowerCase();
  const { items } = req.body;

  const order = orders.get(id) || Array.from(orders.values()).find(o => o.orderNumber.toLowerCase() === id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'No items provided' });
    return;
  }

  for (const item of items) {
    const existing = order.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      order.items.push(item);
    }
  }

  order.subtotal = order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  order.tax = Number((order.subtotal * 0.09).toFixed(2));
  order.total = Number((order.subtotal + order.tax).toFixed(2));
  order.updatedAt = Date.now();
  if (!order.kitchenNotes) {
    order.kitchenNotes = 'Customer added items from digital waiting menu';
  } else {
    order.kitchenNotes += ' | Customer added extra items';
  }

  orders.set(order.id.toLowerCase(), order);
  broadcastSSE('order:updated', order);

  res.json({ order });
});

// Digital Menu Preview Items
app.get('/api/menu', (_req: Request, res: Response) => {
  res.json({
    categories: ['desserts', 'sides', 'beverages'],
    items: [
      {
        id: 'menu-lava-cake',
        name: 'Molten Chocolate Lava Cake',
        category: 'desserts',
        price: 10.50,
        description: 'Warm rich molten fudge center, Madagascar vanilla gelato, fresh raspberries',
        prepTime: '6 mins',
        image: '/src/assets/images/menu_lava_cake_1792049123769.jpg',
        badge: 'Top Pick'
      },
      {
        id: 'menu-truffle-fries',
        name: 'Parmesan Truffle Fries',
        category: 'sides',
        price: 8.50,
        description: 'Crispy hand-cut potatoes, fresh herbs, sea salt, rosemary garlic herb aioli',
        prepTime: '5 mins',
        image: '/src/assets/images/menu_truffle_fries_1792049125384.jpg',
        badge: 'Crowd Favorite'
      },
      {
        id: 'menu-craft-mocktail',
        name: 'Sparkling Berry Botanical',
        category: 'beverages',
        price: 6.50,
        description: 'Handcrafted blackberry elixir, lime wheel, sparkling soda, garden mint',
        prepTime: '3 mins',
        image: '/src/assets/images/menu_craft_beverage_1792049124439.jpg',
        badge: 'Signature'
      },
      {
        id: 'menu-churros',
        name: 'Artisan Cinnamon Churros',
        category: 'desserts',
        price: 9.00,
        description: 'Golden fried Spanish churros rolled in cinnamon sugar with dark chocolate dip',
        prepTime: '6 mins',
        badge: 'Warm & Sweet'
      },
      {
        id: 'menu-onion-rings',
        name: 'Beer-Battered Crispy Rings',
        category: 'sides',
        price: 7.50,
        description: 'Sweet Spanish onions coated in craft ale batter with chipotle dipping mayo',
        prepTime: '5 mins'
      },
      {
        id: 'menu-espresso',
        name: 'Double Shot Reserve Espresso',
        category: 'beverages',
        price: 4.50,
        description: 'Single-origin Ethiopian bean espresso with rich crema',
        prepTime: '2 mins'
      }
    ]
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', sseClients: sseClients.size, orders: orders.size });
});

// Setup Vite Dev Middleware or Serve Production Build
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[BistroPulse Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[BistroPulse Server Error]', err);
  process.exit(1);
});
