# BistroPulse · Restaurant Deployment & Operations Manual

This guide outlines the step-by-step process for deploying and operating the **BistroPulse Gamified Order Tracking & Kitchen Display System** in a live restaurant setting.

---

## Phase 1: Server & Cloud Deployment

### 1. Build the Production Application
Run the standard build script to generate optimized production assets:
```bash
npm run build
```
This produces the compiled client bundle in `/dist` and prepares `server.ts` for execution.

### 2. Environment Configuration
Ensure port `3000` (or `process.env.PORT`) is exposed:
```bash
PORT=3000
NODE_ENV=production
```

### 3. Launching the Full-Stack Server
Run the production Node server:
```bash
npm start
# or: npx tsx server.ts
```
The server serves:
- The customer PWA client on `/`
- The real-time Server-Sent Events stream on `/api/events`
- Order and menu endpoints on `/api/orders` and `/api/menu`

### 4. Custom Domain & HTTPS (Mandatory for PWA & Vibration API)
The **Web Vibration API** (`navigator.vibrate`) and **Service Workers (PWA)** require a secure **HTTPS** origin.
- Connect your domain (e.g. `https://track.yourbistro.com` or `https://order.yourbistro.com`) using Cloudflare, AWS, Google Cloud Run, Railway, or an Nginx reverse proxy with Let's Encrypt SSL.

---

## Phase 2: Kitchen Display System (KDS) Tablet Setup

1. **Hardware Recommendation**:
   - Any 10"–12" tablet (iPad, Samsung Galaxy Tab, or POS touch monitor) placed near the kitchen cook pass or plating station.
   - Recommended: Heavy-duty wall or counter mount with continuous USB power.

2. **Opening the Staff Dashboard**:
   - Navigate to: `https://your-domain.com/?view=kitchen`
   - Log in using your kitchen staff PIN (default: `1234`).
   - Pin or bookmark this page, or tap **Add to Home Screen** to install BistroPulse as a full-screen kiosk app (no browser URL bars).

3. **Audio Alert Configuration**:
   - Keep the tablet volume at ~80%.
   - Ensure the **"Bell On"** toggle in the top-right header is active so chefs hear audio cues when new tickets arrive or items are modified.

---

## Phase 3: Dining Table QR Code Placement

Customers access their live order tracker without downloading anything from an app store.

### 1. Generating Table QR Codes
You can generate a QR code for any table directly from the KDS tablet:
- Open any active order and tap the **QR icon** to view and print the table pass.
- Standard Table URL format:
  ```
  https://your-domain.com/?table=4
  ```
  Or with pre-assigned ticket token:
  ```
  https://your-domain.com/?order=ORD-101&table=4
  ```

### 2. Physical Placement Options
- **Acrylic Table Tents**: Place a double-sided acrylic stand on each table:
  > *"Scan to track your food prep live & play mini-games to win dessert discounts while you wait!"*
- **Table Corner Stickers**: Waterproof QR code vinyl decals placed in the corner of dining tables.
- **Printed Receipt Footer**: Configure your thermal receipt printer to print the tracking QR code at the bottom of the customer receipt:
  > *"Track your order: https://your-domain.com/?order=ORD-104"*

---

## Phase 4: Daily Restaurant Service Workflow

```
[1. Customer Seats & Orders] ───► [2. Ticket Created in KDS]
                                         │
                                         ▼
[3. Customer Scans Table QR] ◄─── [4. Kitchen Prepares Food]
   • Plays Mini-Games (Snake, Trivia)    │
   • Spins Wheel for Discounts           ▼
   • Digital Menu Add-ons        [5. Chef Marks "Ready 🔔"]
                                         │
                                         ▼
                                 [6. Customer Phone Alert]
                                   • Instant Vibration Buzzer
                                   • Loud Dinner Bell Chime
                                   • Full-Screen Alert Modal
                                         │
                                         ▼
                                 [7. Runner Delivers Food]
                                 • Chef marks "Served" in KDS
```

### Detailed Steps:
1. **Taking the Order**:
   - Waitstaff keys the customer's items into the POS or directly into BistroPulse via the **"New Ticket"** button on the KDS tablet.
2. **Waiting Experience**:
   - Customer scans their table QR code with their smartphone camera.
   - The live tracking screen loads instantly. They see estimated cooking time (`~15 mins`) and can play:
     - **Spin the Wheel**: Wins real vouchers (`5% Off`, `Free Drink`, `Free Cake`) saved to their in-app wallet.
     - **Foodie Snake**, **Chef's Tic-Tac-Toe**, or **Gourmet Food Trivia**.
   - If they want an extra dessert or side, they browse the **Digital Waiting Menu** and tap "Add to Table Ticket".
3. **Plating & The Ready Alert**:
   - As soon as the chef plates the dishes, they tap **"Mark Ready 🔔"** on the KDS tablet.
   - Within **50 milliseconds**, the customer's smartphone:
     1. Automatically **pauses any mini-game in progress**.
     2. Triggers the **haptic pager vibration sequence** (`[300, 120, 300, 120, 450, 150, 600]`).
     3. Plays the **dinner bell chime**.
     4. Renders the full-screen **"Your Order is Ready! 🍕"** celebration screen.
4. **Delivery & Completion**:
   - Food runner brings the meal to Table 4 or customer picks up at counter.
   - Chef or runner taps **"Served"** to archive the ticket into daily history.

---

## Phase 5: POS Integration (Optional)

If your restaurant uses an existing POS system (Toast, Square, Clover, Lightspeed):
- Point your POS webhook to POST to `/api/orders`:
  ```json
  POST /api/orders
  {
    "tableNumber": 4,
    "customerName": "Elena R.",
    "items": [
      { "name": "Woodfired Pizza", "quantity": 1, "price": 19.00, "category": "mains" }
    ],
    "kitchenNotes": "Table 4 guest"
  }
  ```
- Any order posted to this endpoint will instantly appear on the KDS and allow real-time customer tracking.
