# Shree Tiffin Service 🍲
> **"Ghar Jaisa Khana, Har Din."**

A complete, production-grade full-stack MERN food delivery platform providing homemade, authentic Indian tiffin delivery service with dual interfaces:
1. **Customer / User Portal**: Browse homestyle meals, manage custom meal plans, live location-aware checkout with GPS pin-pointing, dual payment workflows (COD + Razorpay), categorized order tracking, and leak-free real-time order polling.
2. **Owner / Admin Portal**: Production-safe business operations dashboard with 9 real backend KPIs, advanced order filtering & state machine transitions, dedicated delivery dispatch with interactive Leaflet map, customer direct Call & WhatsApp messaging, COD collection audit trails, and comprehensive customer lifetime relationship management.

---

## 📁 Architecture Overview

```text
Shree-Tiffin-Service/
├── client/                     # Frontend: React 18, Vite, React Router DOM, Axios, Leaflet, Context API
│   ├── src/
│   │   ├── assets/            # Visual branding & media assets
│   │   ├── components/        # Reusable modular UI components (Navbar, Footer, etc.)
│   │   ├── context/           # Global state management (AuthContext, CartContext)
│   │   ├── hooks/             # Custom React hooks (useOrderPolling, etc.)
│   │   ├── layouts/           # Customer & Admin layout wrappers
│   │   ├── pages/             # Customer and Owner view controllers
│   │   │   ├── admin/         # Owner controllers (AdminDashboard, AdminOrders, AdminDelivery, AdminPayments, AdminCustomers)
│   │   │   ├── MyOrders.jsx   # Customer categorized order history
│   │   │   ├── OrderDetails.jsx # Customer live order tracker
│   │   │   └── Checkout.jsx   # Geolocation-aware checkout
│   │   ├── services/          # Axios API service instances (orderService, paymentService, etc.)
│   │   ├── utils/             # Helper functions, formatters, and WhatsApp templates
│   │   ├── App.jsx            # Root application route definitions
│   │   └── main.jsx           # Client entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend: Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Razorpay
│   ├── config/                # DB connection, safety guard & environment configuration
│   ├── controllers/           # Business logic controllers (orderController, paymentController, etc.)
│   ├── middleware/            # Authentication, authorization & error handlers
│   ├── models/                # Mongoose Schemas (User, Meal, Order, Payment, Address)
│   ├── routes/                # REST API endpoints
│   ├── utils/                 # Formatters, order ID generators, seeders
│   ├── server.js              # Express app entrypoint with dynamic env loading
│   ├── test-runner.js         # Master automated test orchestrator
│   ├── .env                   # Server development/production environment variables
│   ├── .env.test              # Isolated test database environment variables
│   └── package.json
│
├── README.md
└── package.json                # Root workspace orchestrator
```

---

## 🚀 Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster or local MongoDB instance

### 2. Installation
Install all dependencies across the root, client, and server workspaces in one step:
```bash
npm run install-all
```

Or install individually:
```bash
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

### 3. Running in Development Mode
Run both backend server (`http://localhost:5000`) and frontend client (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1 — Backend API:
cd server
npm run dev

# Terminal 2 — Frontend Client:
cd client
npm run dev
```

### 4. Production Frontend Build
```bash
cd client
npm run build
```
Creates an optimized production bundle in `client/dist` with 0 build errors.

---

## 🛡️ Database Safety Guard & Automated Testing

### 1. Absolute Test Database Isolation
To protect real customer orders, addresses, and transaction records, the automated test suite **NEVER** runs against the primary development/production database (`shree_tiffin_service`).

- **Test Environment File**: `server/.env.test`
- **Target Database**: `shree_tiffin_service_test`
- **Dedicated Port**: `5001` (preventing conflicts with running dev server on port `5000`)

### 2. Automatic Safety Guard (`validateTestDatabase`)
In `server/config/db.js`, the backend implements a hardcoded guard:
```javascript
export const validateTestDatabase = (uri) => {
  if (process.env.NODE_ENV === 'test') {
    const isTestDb = uri && uri.toLowerCase().includes('test');
    if (!isTestDb) {
      throw new Error(
        'REFUSING TO RUN TESTS: TEST DATABASE REQUIRED. Target database is NOT a dedicated test database.'
      );
    }
  }
};
```
If `NODE_ENV=test` and the connection string does not contain `"test"`, the application immediately halts and refuses to connect.

### 3. Running the Master Test Suite
To run all 8 end-to-end and regression test suites:
```bash
cd server
npm test
# or
node test-runner.js
```

The master test runner automatically:
1. Validates test environment safety.
2. Spawns an isolated test server instance on port `5001` using `server/.env.test`.
3. Waits for active database connectivity and seeding.
4. Sequentially executes all test suites:
   - **Step 2**: Authentication & Authorization (`test-auth.js`)
   - **Step 3**: Meal Management System (`test-meals.js`)
   - **Step 4**: Real Cart & Shopping System (`test-cart.js`)
   - **Step 5**: Customer Address System (`test-addresses.js`)
   - **Step 5**: Checkout Validation & Price Tampering Protection (`test-checkout.js`)
   - **Step 6**: Real Order Lifecycle & State Machine (`test-orders.js`)
   - **Step 7**: Real Payment System — COD & Razorpay (`test-payments.js`)
   - **Step 8**: Owner Operations, Delivery Dispatch & Security (`test-step8-owner-delivery.js`)
5. Shuts down the test server process cleanly and reports a consolidated summary.

---

## ⚙️ Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP Port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGO_URI` | MongoDB connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secure_random_jwt_secret_key` |
| `JWT_EXPIRES_IN`| Token expiration timeframe | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `OWNER_EMAIL` | Default Owner/Admin account email | `owner@shreetiffin.com` |
| `OWNER_PASSWORD` | Default Owner/Admin account password | `Owner@12345` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret (*never sent to client*) | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | `your_webhook_secret` |

### Server Test Environment (`server/.env.test`)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `PORT` | Test runner server port | `5001` |
| `NODE_ENV` | Test environment flag | `test` |
| `MONGO_URI` | Dedicated test database URI | `mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service_test` |
| `TEST_URL` | Test client target URL | `http://localhost:5001/api` |

---

## 💳 Real Payment Architecture (COD & Razorpay)

### 1. Dual Payment Modes
1. **Cash on Delivery (COD)**:
   - Order is created with payment status strictly set to `Pending`.
   - Never falsely marked `Paid` upfront.
   - When the tiffin is delivered and cash is received, the Owner marks the payment collected via `/admin/payments` or `/admin/orders/:id`.
   - Server records owner ID, collection timestamp (`codCollectedAt`), updates payment and order status to `Paid`, and logs an immutable audit trail entry (`COD_COLLECTED`).
   - Duplicate collections are rejected with `400 Bad Request`.
2. **Razorpay Online Payment**:
   - Order initialization via `POST /api/payments/create-order` creates a gateway order in Indian paise (`total * 100`).
   - Server ignores client-submitted amounts; the price is derived strictly from the MongoDB `Order.total`.
   - Official Razorpay Checkout modal handles payment collection on the client.
   - Cryptographic server verification via `POST /api/payments/verify` computes an HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET` in constant time (`crypto.timingSafeEqual`).
   - Idempotent: duplicate verifications return the existing verified payment without double crediting.

### 2. Webhook Integration
- Webhook endpoint at `POST /api/payments/webhook`.
- Authenticated via `X-Razorpay-Signature` using raw request body buffer (`express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })`).
- Automatically transitions orders to `Paid` on `payment.captured` or `order.paid`.

### 3. Security & Credentials Protection
- `RAZORPAY_KEY_SECRET` and `JWT_SECRET` are strictly server-side and never exposed in API responses.
- In test/offline environments, the backend provides an automated sandbox fallback so CI/CD and test suites execute deterministically without live internet dependencies.

---

## 👑 Step 8: Owner Operations & Delivery Management

### 1. Owner Operations Dashboard (`/admin/dashboard`)
Features 9 real-time backend KPI cards computed live:
- **Today's Orders**: Total orders placed today.
- **Pending Orders**: Orders awaiting kitchen confirmation.
- **Preparing**: Orders currently being cooked.
- **Out for Delivery**: Tiffins on the road with riders.
- **Delivered Today**: Completed deliveries today.
- **Today's Revenue**: Realized daily revenue (Paid online + collected COD).
- **Pending COD**: Outstanding cash to be collected by riders.
- **Online Payments**: Total count of successful gateway payments.
- **Active Customers**: Total customers with orders placed in the last 30 days.

### 2. Live Order Operations (`/admin/orders`)
- **Multi-Factor Filters**: Filter simultaneously by Order Status, Payment Method (`COD`, `ONLINE`), Payment Status (`Pending`, `Paid`, `Failed`, `Refunded`), and Date Range (`All`, `Today`, `This Week`, `This Month`).
- **Sorting & Search**: Sort by newest or oldest; live search by customer name, phone, or sequential order number (`STS-2026-XXXX`).
- **Strict State Transitions**: Governed by the lifecycle state machine (`Pending ➔ Confirmed ➔ Preparing ➔ Out for Delivery ➔ Delivered`).
- **Cancellation Reason Modal**: Required cancellation note for owner or customer order cancellations.
- **Quick Communication Actions**: Direct Call and WhatsApp buttons on every order card.

### 3. Delivery Dispatch & Interactive Leaflet Map (`/admin/delivery`)
- **Interactive OpenStreetMap**: Visualizes active deliveries (`Confirmed`, `Preparing`, `Out for Delivery`) with custom branded map pins.
- **Detailed Map Popups**: Displays customer name, phone, full address, landmark, delivery instructions, and payment status badge.
- **1-Click Communication**:
  - **Call Customer**: Mobile-friendly `tel:<phone>` trigger.
  - **WhatsApp Updates**: Generates prefilled, URL-encoded WhatsApp messages tailored to the order's current status (e.g. *"Your delicious tiffin is out for delivery..."*).
  - **Directions**: Opens native Google Maps directions to the exact GPS coordinates.
- **Status Advancement**: One-click button to advance delivery status from the dispatch board.

### 4. Owner Customer Lifetime Management (`/admin/customers`)
- **Customer Directory**: View all registered customers with lifetime statistics:
  - Total Lifetime Orders
  - Completed Orders
  - Cancelled Orders
  - Lifetime Total Spent (₹)
  - Last Order Details (Date, Amount, Status)
- **Customer Detail Modal**: View complete profile, address history with GPS coordinates, and recent order history.
- **Privacy & Security**: Password hashes (`$2a$`, `$2b$`) are strictly excluded from queries and responses (`.select('-password')`).

### 5. Customer Order Experience & Polling
- **Categorized Order Tabs**: Customer order history (`/orders`) is organized into `All`, `Active`, `Completed`, and `Cancelled` tabs with custom empty states.
- **Leak-Free Real-Time Polling (`useOrderPolling`)**: A dedicated React hook that polls active orders every 10 seconds. Automatically halts polling when the order reaches terminal states (`Delivered` or `Cancelled`) or when the component unmounts, preventing background memory leaks.

---

## 📈 Step 9: Advanced Owner Analytics & Business Reporting System

Step 9 introduces an enterprise-grade business intelligence and reporting suite tailored specifically for Shree Tiffin Service owners and kitchen managers. All calculations are strictly server-side, utilizing MongoDB aggregation pipelines to prevent client-side falsification or memory leaks.

### 1. Analytics REST Endpoints
All analytics endpoints enforce strict authentication (`protect`) and Owner authorization (`authorize('owner')`):

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/analytics/overview` | `GET` | Consolidated KPIs: Realized revenue (Today, Yesterday, Week, Month, Prev Month), orders, customers, payments, delivery, profit, comparison growth |
| `/api/analytics/revenue-trend` | `GET` | Time-series realized revenue trends grouped by `daily`, `weekly`, or `monthly` |
| `/api/analytics/order-trend` | `GET` | Time-series order volume trends broken down by Delivered, Cancelled, and Pending |
| `/api/analytics/meals` | `GET` | Meal popularity ranking (Top 5 Best-Sellers & Low-Performing) based on immutable order snapshot items |
| `/api/analytics/customers` | `GET` | Customer retention, segmentation (New, Active, Returning, 2+, 5+ orders), and Top Customer leaderboard |
| `/api/analytics/cancellations` | `GET` | Cancellation rate, financial loss, customer vs. owner cancellations, and reason frequency aggregation |
| `/api/analytics/payments` | `GET` | Online vs. COD payment reconciliation, COD collection rate, pending cash, failed & refunded amounts |
| `/api/analytics/delivery` | `GET` | Delivery completion rate, orders delivered today, active in-transit orders, and average transit time |
| `/api/analytics/peak-times` | `GET` | Peak rush-hour analysis across 24 hours (00:00 to 23:00) and 7 weekdays (Sun to Sat) |
| `/api/analytics/costs` | `GET` | Retrieve configured business cost parameters for profit estimation |
| `/api/analytics/costs` | `POST` | Update business cost settings (ingredient %, packaging per order, delivery per order, monthly overhead) |
| `/api/analytics/export/:reportType` | `GET` | Generate and download RFC 4180-compliant CSV reports (`sales`, `payments`, `customers`, `meals`) |

### 2. Business Metric Definitions & Formulas
- **Realized Revenue**:
  $$\text{Realized Revenue} = \sum \text{Order Total} \quad \text{where } \text{paymentStatus} = \text{'Paid'} \land \text{orderStatus} \neq \text{'Cancelled'}$$
  *Rule*: Pending COD orders and cancelled orders are segregated and never inflate realized revenue.
- **Average Order Value (AOV)**:
  $$\text{AOV} = \frac{\text{Realized Revenue}}{\text{Qualifying Paid Orders Count}}$$
  *Rule*: Safe zero-division handling ensures $0$ is returned if there are no paid orders (no `NaN` or `Infinity`).
- **Active Customers**: Distinct customers who have placed at least one order within the queried date range.
- **New Customers**: Customers who registered their account within the queried date range.
- **Returning Customers**: Customers who placed an order in the queried date range and had at least one order prior to the start date.
- **Repeat Customer Rate**:
  $$\text{Repeat Customer Rate} = \left( \frac{\text{Customers with } \ge 2 \text{ lifetime orders}}{\text{Total ordering customers}} \right) \times 100\%$$
- **Cancellation Rate**:
  $$\text{Cancellation Rate} = \left( \frac{\text{Cancelled Orders in Range}}{\text{Total Orders in Range}} \right) \times 100\%$$
- **Estimated Profit**:
  $$\text{Estimated Profit} = \text{Realized Revenue} - \text{Total Recorded Costs}$$
  $$\text{Total Recorded Costs} = (\text{Revenue} \times \text{Ingredient \%}) + (\text{Paid Orders} \times \text{Packaging Cost}) + (\text{Paid Orders} \times \text{Delivery Cost}) + \text{Prorated Monthly Operating Overhead}$$
  *Rule*: Displayed strictly as "Estimated Profit", never mislabeled as net profit. Never invents missing cost data.

### 3. Exportable CSV Reports
Directly streamed from server-side aggregation pipelines formatted to RFC 4180 standard:
- **Sales Report**: Sequential order number, ISO date, customer name, phone number, item summary snapshots, subtotal, total, payment method, payment status, and order status.
- **Payment Report**: Payment transaction ID, order reference, gateway name, method, amount in INR, transaction state, timestamp, and gateway identifiers.
- **Customer Report**: Customer ID, full name, email, phone, lifetime orders, completed orders, total spend in INR, and last order timestamp.
- **Meal Performance Report**: Meal name, category, total units sold, distinct orders containing meal, total revenue generated, average selling price (ASP), and live availability.

### 4. Database Safety & Test Isolation
- Automated tests strictly run against the dedicated test database (`shree_tiffin_service_test`) on port `5001`.
- Built-in safety guards in `server/config/db.js` inspect connection URIs before any network request, throwing fatal errors if executed against the production database (`shree_tiffin_service`).
- Password hashes (`bcrypt`), JWT secrets, and Razorpay API secrets are completely stripped from all analytics payloads.

---

## 🔔 Step 10: Production-Ready Notifications, Business Settings & System Hardening

Step 10 hardens the Shree Tiffin Service platform for real-world production deployment with real-time operational notifications, business owner operating controls, centralized delivery fee calculations, and comprehensive security protections.

### 1. Notification Data Architecture & Event Triggers
- **Data Model (`server/models/Notification.js`)**:
  - Typed notification categories: `ORDER_PLACED`, `ORDER_CONFIRMED`, `ORDER_PREPARING`, `ORDER_OUT_FOR_DELIVERY`, `ORDER_DELIVERED`, `ORDER_CANCELLED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `COD_COLLECTED`, `SYSTEM`.
  - References user, title, human-readable message, read status flag (`isRead`), and metadata payload (`orderId`, `orderNumber`, `total`, `paymentId`).
  - Compound database index: `{ user: 1, isRead: 1, createdAt: -1 }` for high-performance badge lookups.
- **Automated Event Triggers (`server/services/notificationService.js`)**:
  - **Order Submission**: Automatically triggers an `ORDER_PLACED` notification for the customer with the real order number (e.g. `STS-2026-0001`) and an owner notification for the kitchen.
  - **Status Transitions**: Moving orders to `Confirmed`, `Preparing`, `Out for Delivery`, or `Delivered` dispatches real-time status notifications to the customer.
  - **Cancellations**: Order cancellations by customer or owner dispatch cancellation alerts with cancellation reasons.
  - **Payment Confirmations**: Razorpay online verification triggers `PAYMENT_SUCCESS`; payment failures trigger `PAYMENT_FAILED`; kitchen COD collection triggers `COD_COLLECTED`.
- **Notification Center UI (`client/src/pages/Notifications.jsx`)**:
  - Dedicated customer & owner portal with category filtering tabs (`All`, `Unread`, `Orders`, `Payments`).
  - Individual "Mark Read" actions, "Mark All as Read" batch actions, and direct order navigation links.
  - Dynamic navbar bell icon 🔔 with live unread badge counter polled periodically.

### 2. Business Settings & Operating Controls
- **Singleton Model (`server/models/BusinessSettings.js`)**:
  - `businessInfo`: Official business name, tagline (*"Ghar Jaisa Khana, Har Din."*), phone, email, and kitchen address.
  - `delivery`: Centralized `deliveryFee` (default ₹0 for free delivery), `minimumOrderValue` (enforced during checkout), `deliveryRadius` (km), and customer instructions.
  - `businessHours`: 7-day schedule (Monday to Sunday) with `isOpen`, `openTime`, and `closeTime` in 24-hour `HH:MM` format.
  - `ordering`: Real-time `isAcceptingOrders` toggle, customizable `pausedMessage`, and `maintenanceMode`.
- **Operating Controls Enforcement**:
  - **Store Availability**: When `isAcceptingOrders` is disabled by the owner, customer cart validation and order creation endpoints strictly reject with 400 Bad Request and display the owner's custom paused message.
  - **Minimum Order Enforcement**: Server-side validation blocks checkout if cart subtotal is less than `minimumOrderValue`.
  - **Centralized Delivery Fee**: Centralized calculation added to order subtotal on the backend and immutably captured on the `Order` document.
- **Owner Business Controls UI (`client/src/pages/admin/AdminSettings.jsx`)**:
  - Live toggle to open/pause the kitchen with instant customer checkout enforcement.
  - Pricing controls for delivery fees and minimum orders.
  - Weekly 7-day business hours editor with input validation against invalid time formats.

### 3. System Hardening & Security Protections
- **Cryptographically Secure Password Reset**:
  - Upgraded from insecure body-based updates to a two-step SHA-256 token verification flow.
  - `POST /api/auth/forgot-password`: Generates a single-use 20-byte cryptographic hex token with a 15-minute expiration stored hashed in MongoDB.
  - `POST /api/auth/reset-password/:token`: Validates token match and expiration, hashes new password with bcrypt, and invalidates the token to protect against replay attacks.
  - Direct unverified password resets are permanently rejected.
- **Sliding-Window Rate Limiting (`server/middleware/rateLimiter.js`)**:
  - Sliding-window in-memory rate limiters protecting sensitive endpoints against brute-force attacks:
    - Auth limiter: 15 attempts per 15 minutes for login, register, and password reset.
    - Order limiter: 20 order submissions per 15 minutes.
    - Payment limiter: 30 payment transactions per 15 minutes.
    - Automatically bypassed during automated regression test runs when `TEST_DISABLE_RATELIMIT=true`.
- **HTTP Security Headers (`server/middleware/securityMiddleware.js`)**:
  - Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
  - Content Security Policy (CSP) tailored for the application, whitelisting Razorpay Checkout (`https://checkout.razorpay.com`) and OpenStreetMap tiles (`https://*.tile.openstreetmap.org`).
- **Structured Logging (`server/utils/logger.js`)**:
  - ISO-timestamped JSON-formatted log entries with log levels (`info`, `warn`, `error`, `debug`).
  - Automatic recursive masking of sensitive data keys (`password`, `token`, `secret`, `signature`, `apiKey`, `creditCard`).
- **Production Error Sanitization (`server/middleware/errorMiddleware.js`)**:
  - Graceful conversion of Mongoose CastErrors, ValidationErrors, and MongoDB 11000 duplicate key errors into clean, structured user-friendly responses.
  - Stack traces are strictly suppressed when `NODE_ENV=production`.
- **Database Index Optimization Audit**:
  - Verified compound indexes across User, Meal, Order, Payment, Notification, and BusinessSettings collections.

---

## 🚀 Step 11: Production Deployment, Environment Separation, Observability & Final QA

### 1. Environment Architecture & Safety Isolation
* **Production Database**: `shree_tiffin_service` (Hosted on MongoDB Atlas)
* **Test Database**: `shree_tiffin_service_test` (Enforced by automated pre-connection guards)
* **Zero Credential Leakage**: Automatic regex URI sanitization (`mongodb+srv://***:***@...`) ensures passwords and credentials are never printed in logs or terminal outputs.
* **Environment Configuration Templates**:
  - `server/.env.example`: Comprehensive server environment variables template with clean placeholders.
  - `client/.env.example`: Frontend environment template documenting public `VITE_*` variables.
  - `.gitignore`: Updated to strictly ignore all `.env` and `.env.*` files while tracking `.env.example`.

### 2. Observability: Health & Readiness Probes
* **`GET /api/health`**: Public liveness check reporting service status (`online`), database state (`connected`), server uptime, memory usage, and official tagline (*"Ghar Jaisa Khana, Har Din."*) without exposing private credentials or connection strings.
* **`GET /api/ready` & `GET /api/health/ready`**: Kubernetes/Render readiness probe returning `200 OK` when the database connection is active and ready to receive traffic, or `503 Service Unavailable` if disconnected.
* **Request ID Traceability (`server/middleware/requestIdMiddleware.js`)**: Generates or preserves `X-Request-Id` (UUID v4) on every HTTP transaction for distributed request tracing.

### 3. Production CORS & Graceful Shutdown
* **Production CORS**: Strictly validates incoming requests against the configured `CLIENT_URL` in production mode while supporting local/LAN origins during development.
* **Graceful Shutdown**: Listens for `SIGTERM` and `SIGINT` signals, closes the Express HTTP listener, and safely terminates MongoDB connections without abruptly aborting in-flight orders.

### 4. SPA Routing & Frontend Performance Code-Splitting
* **SPA Routing (`client/public/_redirects`)**: Contains rewrite rule `/* /index.html 200` to prevent 404 errors on browser refresh across customer and owner routes when hosted on static site providers (Render, Netlify, Cloudflare Pages).
* **Route-Level Code Splitting (`client/src/App.jsx`)**: Admin and owner dashboards are dynamically imported using `React.lazy` and wrapped in `React.Suspense`. This optimizes mobile load times and decreases the initial customer bundle size.

### 5. Production Documentation
* [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): End-to-end deployment guide for Render Web Service (backend) and Render Static Site (frontend) with MongoDB Atlas and Razorpay live mode.
* [docs/PRODUCTION-BACKUP-RECOVERY.md](docs/PRODUCTION-BACKUP-RECOVERY.md): MongoDB Atlas backup schedules, Point-in-Time Recovery (PITR), disaster recovery runbooks, and credential rotation procedures.
* [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md): 30-point production go-live verification checklist across Infrastructure, Security, Payments, Business Logic, and QA.

### 6. Master Regression Test Suite (Steps 1–12)
Automated test suite orchestrating all 12 project phases against isolated test database `shree_tiffin_service_test` on dedicated port `5001`:
1. `Step 2: Authentication System` — ✅ **PASSED**
2. `Step 3: Meal Management System` — ✅ **PASSED**
3. `Step 4: Cart & Shopping System` — ✅ **PASSED**
4. `Step 5: Address System` — ✅ **PASSED**
5. `Step 5: Checkout Validation` — ✅ **PASSED**
6. `Step 6: Order Lifecycle` — ✅ **PASSED**
7. `Step 7: Payment System` — ✅ **PASSED**
8. `Step 8: Owner Operations & Delivery` — ✅ **PASSED**
9. `Step 9: Owner Analytics & Business Reporting` — ✅ **PASSED**
10. `Step 10: Notifications, Business Settings & System Hardening` — ✅ **PASSED**
11. `Step 11: Production Deployment, Environment Separation, Observability & Final QA` — ✅ **PASSED**
12. `Step 12: Actual Production Deployment & Verification` — ✅ **PASSED** (50/50 passed)

---

## 🚀 Step 12: Actual Production Deployment on GitHub, Render, MongoDB Atlas & Razorpay

### 1. Deployment Architecture (GitHub ➔ Render ➔ Atlas ➔ Razorpay)
* **Render Blueprint (`render.yaml`)**: Infrastructure as Code defining backend Web Service (`shree-tiffin-api`) and frontend Static Site (`shree-tiffin`).
* **Backend Web Service**: Node.js runtime, port `10000` dynamic binding, health check at `/api/health`, and readiness probe at `/api/ready`.
* **Frontend Static Site**: Vite production build (`dist/`), single-page application rewriting (`/* -> /index.html 200`), with zero hardcoded development URLs.
* **Production Database**: MongoDB Atlas `shree_tiffin_service` with sanitized logging and zero credential leakage.
* **Razorpay Gateway**: Test Mode & Live Mode architecture, server-side HMAC SHA-256 signature verification, and raw body webhook HMAC verification (`/api/payments/webhook`).

### 2. Pre-Deployment Static Scans
* **Secret Leakage Audit**: 0 secrets committed; `.env` strictly ignored by `.gitignore`.
* **Zero Localhost Audit**: Zero hardcoded `localhost`, `127.0.0.1`, or `192.168.` in `client/src` production code.
* **Database Isolation**: Dedicated test suite strictly isolated to `shree_tiffin_service_test` on port `5001`.

### 3. Step 12 Verification Suite
* **Automated Test Suite (`server/test-step12-deployment.js`)**: 50/50 assertions passed across Environment Isolation, Observability, Security Headers, SPA Routing, Render Blueprint, Business Flows, and HMAC Razorpay Verification.

---

## 🌐 Production Deployment Guide

For complete, step-by-step instructions, refer to the [Owner Cloud Activation Runbook](docs/OWNER-CLOUD-ACTIVATION.md).

```text
1. Create/push GitHub repository:
   git init && git add . && git commit -m "Production Release"
   git remote add origin https://github.com/<YOUR_USERNAME>/shree-tiffin-service.git
   git push -u origin main

2. Connect repository to Render:
   Navigate to dashboard.render.com -> New + -> Blueprint

3. Create Blueprint:
   Select your connected GitHub repository

4. Render reads render.yaml:
   Automatically provisions shree-tiffin-api (Backend) and shree-tiffin (Frontend)

5. Configure environment variables:
   Enter MONGO_URI, CLIENT_URL, VITE_API_BASE_URL, and Razorpay test/live keys

6. Deploy backend:
   Render builds and deploys Node.js Web Service on dynamic port

7. Deploy frontend:
   Render builds Vite production bundle and deploys Static Site with SPA rewrites

8. Verify health endpoint:
   GET https://<REAL-BACKEND-URL>/api/health and /api/ready (HTTP 200 OK)

9. Verify frontend:
   Open https://<REAL-FRONTEND-URL> and complete customer/owner smoke test

10. Configure Razorpay webhook:
    Register https://<REAL-BACKEND-URL>/api/payments/webhook in Razorpay Dashboard
```

---

## 📄 License & Attribution
Developed for **Shree Tiffin Service** — *"Ghar Jaisa Khana, Har Din."*
All rights reserved © 2026.
