# Shree Tiffin Service — Production Go-Live Checklist
### Tagline: *“Ghar Jaisa Khana, Har Din.”*

Use this checklist to verify production readiness. Items are rigorously classified into:
* **`[CODE VERIFIED]`**: Automated tests and static audits verify 100% compliance in codebase.
* **`[DEPLOYMENT VERIFIED]`**: Verified against live deployed cloud instances.
* **`[OWNER ACTION REQUIRED]`**: Requires account creation or secret entry by cloud resource owner.

---

## 1. Infrastructure & Hosting
- [x] `[CODE VERIFIED]` Render Blueprint (`render.yaml`) created with Web Service and Static Site specifications.
- [x] `[CODE VERIFIED]` SPA routing fallback configured (`client/public/_redirects` and `server.js` catch-all).
- [ ] `[OWNER ACTION REQUIRED]` Push repository to GitHub and connect repository to Render Blueprint.
- [ ] `[OWNER ACTION REQUIRED]` Provision MongoDB Atlas cluster in `ap-south-1` (Mumbai) with target DB `shree_tiffin_service`.
- [ ] `[OWNER ACTION REQUIRED]` Add Atlas Network Access rule (`0.0.0.0/0` with user authentication).
- [ ] `[DEPLOYMENT VERIFIED]` Backend Web Service activated on Render (`[actual Render URL]`).
- [ ] `[DEPLOYMENT VERIFIED]` Frontend Static Site activated on Render (`[actual Render URL]`).
- [ ] `[DEPLOYMENT VERIFIED]` Automatic SSL/HTTPS provisioned and active on Render domains.
- [ ] `[OWNER ACTION REQUIRED]` Attach custom domain (e.g. `shreetiffin.com`) to Render and configure DNS records.

---

## 2. Environment Variables & Secret Security
- [x] `[CODE VERIFIED]` No secrets tracked by git; `.gitignore` ignores all `.env*` files except `.env.example`.
- [x] `[CODE VERIFIED]` Clean `.env.example` templates provided for server and client with zero secret values.
- [x] `[CODE VERIFIED]` Frontend code audited: zero private keys, JWT secrets, or DB URIs bundled into client build.
- [x] `[CODE VERIFIED]` Zero hardcoded `localhost`, `127.0.0.1`, or `192.168.` in `client/src` production code.
- [x] `[CODE VERIFIED]` Dynamic `PORT` binding (`process.env.PORT`) implemented for Render compatibility.
- [ ] `[OWNER ACTION REQUIRED]` Configure production secrets (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`) in Render dashboard.
- [ ] `[DEPLOYMENT VERIFIED]` Verify production backend logs sanitize MongoDB URIs (`mongodb+srv://***:***@...`).

---

## 3. Payment Processing & Razorpay
- [x] `[CODE VERIFIED]` Server-side HMAC SHA-256 signature verification implemented and tested (`verifyPaymentSignature`).
- [x] `[CODE VERIFIED]` Razorpay webhook verification implemented with raw body HMAC validation (`verifyWebhookSignature`).
- [x] `[CODE VERIFIED]` Minimum order amount validation enforced (rejects < 100 paise).
- [x] `[CODE VERIFIED]` Resilient sandbox fallback engaged for offline and automated test environments.
- [x] `[CODE VERIFIED]` Cash on Delivery (COD) workflow verified with explicit owner collection marking.
- [ ] `[OWNER ACTION REQUIRED]` Register production webhook in Razorpay Dashboard: `https://[backend].onrender.com/api/payments/webhook`.
- [ ] `[OWNER ACTION REQUIRED]` Input live Razorpay API Keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) into Render environment.
- [ ] `[DEPLOYMENT VERIFIED]` Execute first live test transaction in Razorpay Test/Live Mode and verify webhook capture.

---

## 4. Core Business Operations & Hardening
- [x] `[CODE VERIFIED]` Sequential collision-free order numbering (`STS-2026-XXXX`) verified.
- [x] `[CODE VERIFIED]` Role-based access control (RBAC): Customers strictly blocked from admin endpoints (HTTP 403).
- [x] `[CODE VERIFIED]` Dynamic kitchen pause toggle verified operational (blocks checkout when closed).
- [x] `[CODE VERIFIED]` Centralized delivery fee and minimum order value enforced server-side.
- [x] `[CODE VERIFIED]` Single-use 15-minute cryptographic password reset tokens verified against replay attacks.
- [x] `[CODE VERIFIED]` Persistent in-app notification center and real-time unread badge verified.
- [x] `[CODE VERIFIED]` Owner Analytics engine with 24-hour distribution and CSV export verified.
- [ ] `[DEPLOYMENT VERIFIED]` Owner logs in to live admin portal and updates initial business settings.

---

## 5. Security, Observability & QA
- [x] `[CODE VERIFIED]` Security headers active: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] `[CODE VERIFIED]` Content Security Policy (CSP) whitelisting Razorpay and OpenStreetMap tiles active.
- [x] `[CODE VERIFIED]` Request ID tracing (`X-Request-Id`) attached to all HTTP requests and responses.
- [x] `[CODE VERIFIED]` Production error handler suppresses internal stack traces.
- [x] `[CODE VERIFIED]` Health check endpoint (`GET /api/health`) reports status, database, uptime, and safe memory metrics.
- [x] `[CODE VERIFIED]` Readiness probe (`GET /api/ready` and `GET /api/health/ready`) reports 200 when DB is connected, 503 if down.
- [x] `[CODE VERIFIED]` Full regression test suite passing 100% on dedicated test database (`shree_tiffin_service_test`).
- [x] `[CODE VERIFIED]` Client production build (`npm run build`) passing with 0 errors and code-split admin chunks.
- [ ] `[DEPLOYMENT VERIFIED]` Health endpoint probed on live Render URL: `https://[backend].onrender.com/api/health` returns 200 OK.
- [ ] `[DEPLOYMENT VERIFIED]` Readiness endpoint probed on live Render URL: `https://[backend].onrender.com/api/ready` returns 200 OK.
