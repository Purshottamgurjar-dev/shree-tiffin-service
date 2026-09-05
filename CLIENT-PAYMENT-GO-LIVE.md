# 💳 SHREE TIFFIN SERVICE — RAZORPAY PAYMENT GO-LIVE CHECKLIST
> **Tagline:** “Ghar Jaisa Khana, Har Din.”  
> **Status:** Test Mode Certified (Sandbox Ready) ➡️ Awaiting Client Live Mode Activation  

---

## ⚠️ ABSOLUTE SECURITY RULES

1. **NEVER COMMIT RAZORPAY SECRET KEYS TO GIT.**
2. **NEVER PUT RAZORPAY SECRET KEYS IN `VITE_*` FRONTEND VARIABLES.**
3. **ONLY THE PUBLIC KEY ID (`rzp_live_...` or `rzp_test_...`) MAY BE EXPOSED TO THE CLIENT APP.**
4. **DO NOT SWITCH TO LIVE MODE WITHOUT EXPLICIT MERCHANT ONBOARDING COMPLETION.**

---

## 📋 PRE-LIVE COMPLIANCE CHECKLIST

Before swapping any keys on your production server, verify every requirement below:

- [ ] **1. Active Razorpay Business Account**
  - Sign up and log in at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
  - Complete your Business Profile (Business type, Category: Food & Beverage / Catering).

- [ ] **2. Complete KYC & Bank Account Verification**
  - Upload PAN Card, Aadhaar Card, GSTIN (if applicable), and Bank Account details.
  - Wait for Razorpay Compliance approval (*Status must show "Activated"*).

- [ ] **3. Generate Live API Keys**
  - Navigate to **Settings** ➡️ **API Keys** on your Razorpay Dashboard.
  - Switch the environment toggle in the top navbar from **Test Mode** to **Live Mode**.
  - Click **Generate Key** to receive:
    - `Key ID` (begins with `rzp_live_...`)
    - `Key Secret` (secure 24-character secret; store in a password manager immediately).

- [ ] **4. Configure Production Webhooks**
  - Navigate to **Settings** ➡️ **Webhooks** ➡️ **Add New Webhook**.
  - **Webhook URL:** `https://shree-tiffin-api.onrender.com/api/payments/webhook`
  - **Secret:** Generate a random 32-character string and save it securely.
  - **Active Events to Enable:**
    - `payment.authorized`
    - `payment.captured`
    - `payment.failed`
    - `order.paid`

- [ ] **5. Verified Test Mode Capabilities (Certified in Step 20 & 21)**
  - [x] Genuine Razorpay Order ID creation verified (official `order_...` gateway format).
  - [x] Server-authoritative amount calculation (amount in paise, verified server-side).
  - [x] HMAC-SHA256 signature verification verified with timing-safe comparison.
  - [x] Tampered signature rejection tested (returns 400 Bad Request).
  - [x] Duplicate payment replay protection tested (returns existing payment safely).
  - [x] Failed payment leaves order safely in `Pending` state for retry.
  - [x] Cash on Delivery (COD) remains active alongside Razorpay.

---

## 🚀 GO-LIVE ACTIVATION STEPS (CLIENT ACTION)

Once KYC approval and Live API Keys are obtained:

### Step 1: Update Backend Environment Variables in Render
1. Open your [Render Dashboard](https://dashboard.render.com).
2. Click on your backend service: **`shree-tiffin-api`**.
3. Go to the **Environment** tab.
4. Update the following values:
   - `RAZORPAY_KEY_ID`: Paste your `rzp_live_...` Key ID.
   - `RAZORPAY_KEY_SECRET`: Paste your live Key Secret.
   - `RAZORPAY_WEBHOOK_SECRET`: Paste your live Webhook Secret.
5. Click **Save Changes**. Render will automatically restart the backend service.

### Step 2: Update Frontend Environment Variable in Render
1. In the Render Dashboard, click on your frontend static site: **`shree-tiffin`**.
2. Go to the **Environment** tab.
3. Update the following value:
   - `VITE_RAZORPAY_KEY_ID`: Paste your `rzp_live_...` Key ID (public only).
4. Click **Save Changes** and trigger a manual redeploy (**Deploy latest commit**).

### Step 3: Complete Live Smoke Test
1. As a regular customer, add a meal (e.g. Poha for ₹60).
2. Proceed to checkout and select **Online Payment (Razorpay)**.
3. Complete a genuine payment of ₹60 using UPI / QR code.
4. Verify:
   - Payment succeeds and order status updates to **Paid / Confirmed**.
   - Transaction appears in your Razorpay Dashboard under **Transactions**.
   - Owner receives instant real-time notification.
5. (Optional) Refund the ₹60 test order directly from the Razorpay Dashboard to verify refund sync.
