# 📦 Shree Tiffin Service — Production Client Handover Guide

> **Tagline:** *"Ghar Jaisa Khana, Har Din."*  
> **Target Audience:** Kitchen Owners, Store Administrators, and Technical Operators.  
> **Official Business Email:** `shreetiffinservice09@gmail.com`  
> **Official Business Phone:** `8120414836`  

---

## 🌐 1. Live Production URLs

* **Customer Storefront:** [https://shree-tiffin.onrender.com](https://shree-tiffin.onrender.com)
* **Private Owner / Admin Portal:** [https://shree-tiffin.onrender.com/admin/login](https://shree-tiffin.onrender.com/admin/login)
* **Backend API Gateway:** [https://shree-tiffin-api.onrender.com/api](https://shree-tiffin-api.onrender.com/api)
* **System Health Monitor:** [https://shree-tiffin-api.onrender.com/api/health](https://shree-tiffin-api.onrender.com/api/health)
* **XML Sitemap:** [https://shree-tiffin.onrender.com/sitemap.xml](https://shree-tiffin.onrender.com/sitemap.xml)
* **Robots Directives:** [https://shree-tiffin.onrender.com/robots.txt](https://shree-tiffin.onrender.com/robots.txt)

---

## 🔐 2. Owner Account & Authentication Security

* **Registered Owner Account Email:** `shreetiffinservice09@gmail.com`
* *(Owner password is encrypted using salted bcrypt hashing and is strictly never stored in code, Git, or documentation).*
* **Private Portal Access:** Kitchen owners log in exclusively through `/admin/login`. 
* **Customer Separation:** There are **zero** owner or administrator links on the customer storefront. Public registration (`/register`) strictly forces `role="customer"`. Exploitation attempts to register as `role="owner"` or `role="admin"` are strictly rejected with HTTP 403 Forbidden.
* **Role-Based Authorization:** Every request to administrative endpoints is verified server-side with a cryptographic JWT session token with `role: "owner"`. Normal customer tokens receive **HTTP 403 Forbidden**.
* **Password Rotation:** Authenticated owners can rotate their password at any time via the secure endpoint `PUT /api/auth/change-password` (requires current password verification, new password confirmation, and complexity validation).

---

## 🍽️ 3. Production Menu & Kitchen Inventory

| Meal Item | Category | Serving Style | Baseline Price | In-Stock Status |
| :--- | :--- | :--- | :--- | :--- |
| **Desi Poha & Masala Chai Combo** | `BREAKFAST` | Single Tiffin | ₹60 | In Stock (Active) |
| **Light & Healthy Khichdi Bowl** | `DINNER` | Single Bowl | ₹85 | In Stock (Active) |
| **Executive Homestyle Lunch Box** | `LUNCH` | 3-Tier Tiffin | ₹95 | In Stock (Active) |
| **Special Royal Veg Thali** | `THALI` | Deluxe Meal | ₹130 | In Stock (Active) |

*Commercial Pricing Note: The kitchen owner can update prices and stock status in real-time under `/admin/meals`.*

---

## 📋 4. Order Lifecycle Management

1. Open **Orders** (`/admin/orders`).
2. Live orders appear with real-time status, customer name, delivery address, ordered items, and payment mode (`COD` or `ONLINE`).
3. **Order Status Workflow:**
   $$\text{Pending} \longrightarrow \text{Confirmed} \longrightarrow \text{Preparing} \longrightarrow \text{Out for Delivery} \longrightarrow \text{Delivered}$$
   * **Pending:** Newly submitted customer order. Click **Accept & Confirm**.
   * **Confirmed:** Kitchen acknowledges order.
   * **Preparing:** Meal is actively being cooked in pure cow ghee.
   * **Out for Delivery:** Delivery rider is en route.
   * **Delivered:** Tiffin handed to customer.
4. **Order History Trail:** Every status transition records the timestamp and acting user in the order's immutable history audit log.
5. **Direct Customer Communication:** Each order card features a direct `tel:` call link and one-click WhatsApp chat link.

---

## 💵 5. Managing Cash on Delivery (COD) & Online Payments

* **Cash on Delivery (COD):**
  * When a customer places a COD order, the order is created with `paymentStatus: "Pending"`.
  * Once your rider collects physical cash at the doorstep, open the order or **Payments** (`/admin/payments`) and click **Record Cash Collected**.
  * The payment status will instantly transition to `"Paid"`.
* **Online Payments (Razorpay):**
  * Online payments are processed through Razorpay.
  * Payment amounts are derived authoritatively from the server database order total (in paise).
  * Successful payments are cryptographically verified via HMAC-SHA256 signatures before updating the order status.
  * For live mode activation instructions, see `CLIENT-PAYMENT-GO-LIVE.md`.

---

## ⚙️ 6. Business Settings & Pausing Orders

1. Open **Settings** (`/admin/settings`).
2. **Pause Orders:** If the kitchen reaches maximum capacity, toggle *"Accepting Orders"* to **OFF**. 
   * Customers attempting to order will see your customized message (e.g., *"Kitchen is currently full. We reopen tomorrow at 7:00 AM."*).
3. **Delivery Radius & Fee:** Adjust delivery radius (default: 15 km) and base delivery fee (default: ₹0 free delivery).
4. **Business Hours:** Configure kitchen opening and closing times per weekday (default: 07:00–22:00, 7 days).
5. **Kitchen Contact Information:**
   * Kitchen Address: 104 Annapurna Road, Indore, Madhya Pradesh 452009
   * Support Phone: `8120414836`
   * Support Email: `shreetiffinservice09@gmail.com`

---

## 👥 7. Customer Directory & Business Analytics

* **Customer Directory (`/admin/customers`):** View customer profiles, delivery addresses, phone numbers, total orders, and lifetime spending.
* **Business Analytics (`/admin/analytics`):**
  * Monitor realized revenue, delivered orders, and Average Order Value (AOV).
  * Inspect peak ordering hours and weekday order distributions to plan kitchen preparation.
  * Review cost breakdowns (ingredients, packaging, delivery) and estimated net profit.

---

## 🚨 8. Security Rules — What Must NEVER Be Shared

| Secret / Credential | Safe Storage | NEVER Put In |
| :--- | :--- | :--- |
| **Owner Password** | Password Manager / Private CLI | Chat, Git, Email, Frontend Code |
| **JWT_SECRET** | Render Environment Variables | GitHub, public commits, client bundles |
| **MONGO_URI** | Render Environment Variables | Public repos, client code |
| **RAZORPAY_KEY_SECRET** | Render Environment Variables | Frontend code (`VITE_` variables) |

*Note: The frontend static site receives ONLY the public `VITE_RAZORPAY_KEY_ID`.*

---

## 🌐 9. Custom Domain & Search Console Setup

* **Custom Domain:** Connect your custom domain following the steps in `CLIENT-SEO-LAUNCH.md`.
* **Google Search Console:** Submit `sitemap.xml` and request indexing for `/` and `/menu`.

---

## 🔴 10. CLIENT LAUNCH CHECKLIST

### REQUIRED BEFORE REAL PUBLIC LAUNCH:
- [x] **Owner Account Setup:** Account provisioned for `shreetiffinservice09@gmail.com`.
- [x] **Initial Password Changed:** Personal secure password configured by owner.
- [x] **Real Business Contact Details:** Phone `8120414836` and email `shreetiffinservice09@gmail.com` set in database.
- [ ] **Final Menu & Pricing Confirmation:** Owner confirms commercial prices in `/admin/meals`.
- [ ] **Razorpay Merchant KYC:** Complete business verification on Razorpay Dashboard.
- [ ] **Razorpay Live Mode:** Insert live API keys in Render backend environment (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).
- [ ] **End-to-End Live Transaction:** Complete 1 live payment test with UPI/Card.

### RECOMMENDED UPON LAUNCH:
- [ ] **Custom Domain Connected:** Map `shreetiffinservice.in` to Render static site.
- [ ] **Google Search Console:** Verify domain property and submit sitemap.
- [ ] **Local Google Business Profile:** Register Google My Business for Indore kitchen location.

---

## 🛟 11. Emergency Rollback & Recovery Procedures

1. **Rollback Git Deploy:**
   If any production regression occurs, roll back on Render with:
   - Go to Render Dashboard ➡️ `shree-tiffin-api` ➡️ **Deploys** ➡️ Select previous commit (`6c03078`) ➡️ Click **Rollback to this deploy**.
2. **Database Backup & Restoration:**
   Follow instructions in [docs/PRODUCTION-BACKUP-RECOVERY.md](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/docs/PRODUCTION-BACKUP-RECOVERY.md) using `mongodump` and `mongorestore`.
3. **Emergency Pause:**
   If food preparation is interrupted, navigate to `/admin/settings` and switch **Accepting Orders** to **OFF**.
