# Shree Tiffin Service — Production Deployment Guide
### Tagline: *“Ghar Jaisa Khana, Har Din.”*

---

## 1. Actual Deployment Target Registry

> [!NOTE]
> In accordance with production deployment verification rules, actual live deployment URLs require activation by the repository and cloud account owner. The values below are configured and ready to be bound upon owner activation.

* **GitHub Repository**: `[repository URL]` *(Pending owner repository creation and push)*
* **Frontend Static Site**: `[actual Render URL]` *(Deployment URL pending owner activation)*
* **Backend Web Service**: `[actual Render URL]` *(Deployment URL pending owner activation)*
* **Health Endpoint**: `[actual health URL]/api/health` *(Deployment URL pending owner activation)*
* **Readiness Endpoint**: `[actual readiness URL]/api/ready` *(Deployment URL pending owner activation)*
* **Webhook Endpoint**: `[actual webhook URL]/api/payments/webhook` *(Deployment URL pending owner activation)*

---

## 2. Target Production Architecture

```text
                                +---------------------------+
                                |  Customer / Owner Browser |
                                +-------------+-------------+
                                              |
                       HTTPS Requests         | HTTPS Static Assets
                                              v
               +------------------------------+-----------------------------+
               |                                                            |
               v                                                            v
+-------------------------------+                            +-------------------------------+
|    Render Web Service (API)   |                            |   Render Static Site (UI)     |
|   shree-tiffin-api.onrender   |                            |    shree-tiffin.onrender      |
+---------------+---------------+                            +---------------+---------------+
                |                                                            |
                | CORS: CLIENT_URL = https://shree-tiffin.onrender           |
                v                                                            |
+---------------+---------------+                                            |
|       MongoDB Atlas           |                                            |
|   shree_tiffin_service        |                                            |
+---------------+---------------+                                            |
                |                                                            |
                | Server-Side HMAC SHA-256 Verification                      |
                v                                                            v
+---------------+------------------------------------------------------------+---------------+
|                                    Razorpay Gateway                                        |
|                          Live Mode / Test Mode API & Webhooks                              |
+--------------------------------------------------------------------------------------------+
```

---

## 3. Automated Deployment via Render Blueprint (`render.yaml`)

The repository includes a ready-to-deploy **Render Blueprint** ([render.yaml](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/render.yaml)) defining both services as Infrastructure as Code.

### Step-by-Step Blueprint Activation:
1. Push your repository to GitHub.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Blueprint**.
4. Select your connected GitHub repository.
5. Render detects `render.yaml` and provisions:
   * **`shree-tiffin-api`** (Node Web Service)
   * **`shree-tiffin`** (Static Site with SPA rewrite `/* -> /index.html`)
6. Populate the missing environment secrets in the Render dashboard:
   * `MONGO_URI`: Your MongoDB Atlas production connection string.
   * `CLIENT_URL`: The URL assigned to your frontend static site (e.g. `https://shree-tiffin.onrender.com`).
   * `VITE_API_BASE_URL`: The URL assigned to your backend web service (e.g. `https://shree-tiffin-api.onrender.com/api`).
   * `RAZORPAY_KEY_ID`: Your Razorpay Key ID (Test or Live).
   * `RAZORPAY_KEY_SECRET`: Your Razorpay Secret.
   * `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay Webhook Secret.
   * `OWNER_PASSWORD`: Strong password for the seeded kitchen owner account.
7. Click **Apply**. Render automatically builds and deploys both services.

---

## 4. Manual Deployment Setup (Alternative to Blueprint)

### A. MongoDB Atlas Database Setup
1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a project: `Shree Tiffin Service`.
3. Provision an **M0 (Free)** or **M10+** cluster in `ap-south-1` (Mumbai) for low latency across India.
4. **Network Access**: Add `0.0.0.0/0` to allow Render instances to connect (secured via user credentials).
5. **Database Access**: Create a dedicated database user with `readWrite` permissions on database `shree_tiffin_service`.
6. Copy Connection String:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/shree_tiffin_service?retryWrites=true&w=majority`
   *(Strictly ensure database name is `shree_tiffin_service`).*

### B. Backend Web Service on Render
* **Type**: Web Service
* **Root Directory**: `server`
* **Runtime**: `Node`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Health Check Path**: `/api/health`
* **Environment Variables**:
  | Variable | Value / Format | Purpose |
  | :--- | :--- | :--- |
  | `NODE_ENV` | `production` | Production mode & error sanitization |
  | `PORT` | `10000` | Assigned dynamically by Render |
  | `CLIENT_URL` | `https://[frontend].onrender.com` | Strict CORS origin enforcement |
  | `MONGO_URI` | `mongodb+srv://.../shree_tiffin_service` | Atlas production URI |
  | `JWT_SECRET` | `32+_random_char_secret` | Signs JWT session tokens |
  | `JWT_EXPIRE` | `30d` | Token lifetime |
  | `RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...` | Razorpay Key ID |
  | `RAZORPAY_KEY_SECRET` | `secret` | Razorpay Secret |
  | `RAZORPAY_WEBHOOK_SECRET`| `webhook_secret` | Webhook verification |
  | `OWNER_EMAIL` | `owner@shreetiffin.com` | Seed owner email |
  | `OWNER_PASSWORD` | `SecurePassword@123` | Seed owner password |

### C. Frontend Static Site on Render
* **Type**: Static Site
* **Root Directory**: `client`
* **Build Command**: `npm install && npm run build`
* **Publish Directory**: `dist`
* **SPA Rewrite**:
  * Source: `/*`
  * Destination: `/index.html`
  * Action: `Rewrite`
* **Environment Variables**:
  | Variable | Value | Purpose |
  | :--- | :--- | :--- |
  | `VITE_API_BASE_URL` | `https://[backend].onrender.com/api` | Backend API base URL |
  | `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...` | Public Razorpay key ID only |

---

## 5. Razorpay Webhook Configuration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ **Add New Webhook**.
3. **Webhook URL**: `https://[backend].onrender.com/api/payments/webhook`
4. **Secret**: Enter strong secret matching `RAZORPAY_WEBHOOK_SECRET` in Render.
5. **Active Events**:
   * `payment.captured`
   * `payment.failed`
   * `order.paid`
6. Save Webhook.

---

## 6. Post-Deployment Verification & Smoke Tests

After Render deployment is active:
1. **Health Check**:
   `GET https://[backend].onrender.com/api/health`
   Verify: HTTP 200, `status: "online"`, `database: "connected"`.
2. **Readiness Check**:
   `GET https://[backend].onrender.com/api/ready`
   Verify: HTTP 200, `ready: true`, `database: "connected"`.
3. **Customer Flow**:
   * Open frontend URL.
   * Register customer account.
   * Add Thali to cart.
   * Select delivery address on Leaflet map.
   * Complete COD or Razorpay test order.
   * Confirm order notification received (`STS-2026-XXXX`).
4. **Owner Flow**:
   * Log in to `/admin/login` using `OWNER_EMAIL` and `OWNER_PASSWORD`.
   * Transition order: `Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Delivered`.
   * For COD, click **Mark Payment Collected**.
   * Confirm realized revenue on `/admin/analytics`.

---

## 7. Rollback & Disaster Recovery
* **Instant Rollback**: In Render Dashboard $\rightarrow$ Deploys $\rightarrow$ Select previous deploy $\rightarrow$ **Rollback to this deploy**.
* **Database Recovery**: Follow Point-in-Time Recovery instructions in [PRODUCTION-BACKUP-RECOVERY.md](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/docs/PRODUCTION-BACKUP-RECOVERY.md).
