# 📦 Shree Tiffin Service — Production Client Handover Guide

> **Tagline:** *"Ghar Jaisa Khana, Har Din."*  
> **Target Audience:** Kitchen Owners, Store Administrators, and Technical Operators.

---

## 🌐 1. Live Production URLs

* **Customer Storefront:** [https://shree-tiffin.onrender.com](https://shree-tiffin.onrender.com)
* **Private Owner / Admin Portal:** [https://shree-tiffin.onrender.com/admin/login](https://shree-tiffin.onrender.com/admin/login)
* **Backend API Gateway:** [https://shree-tiffin-api.onrender.com/api](https://shree-tiffin-api.onrender.com/api)
* **System Health Monitor:** [https://shree-tiffin-api.onrender.com/api/health](https://shree-tiffin-api.onrender.com/api/health)

---

## 🔐 2. Owner Authentication & Security

* **Private Portal Access:** Kitchen owners log in exclusively through `/admin/login`. 
* **Customer Separation:** There are **zero** owner or administrator links on the customer storefront. Normal customers cannot access or discover owner controls.
* **Role-Based Authorization:** Every request to administrative endpoints is verified server-side with a cryptographic JWT session token with `role: "owner"`. Normal customer tokens receive **HTTP 403 Forbidden**.
* **Direct URL Protection:** If an unauthorized user attempts to open `/admin` or `/admin/dashboard`, they are redirected to `/admin/login` or `/unauthorized`.

---

## 🍽️ 3. How to Manage the Meal Menu

1. Log in to `/admin/login` and navigate to **Menu Items** (`/admin/meals`).
2. **Add a New Meal:** Click *"Add New Meal"*, provide name, description, category (`THALI`, `BREAKFAST`, `LUNCH`, `DINNER`), price in INR, and image URL.
3. **Availability Toggle:** If an item is sold out for the day, toggle *"In Stock / Available"* off. The item will immediately be hidden from customer cart ordering.
4. **Featured Items:** Highlight your signature thalis by checking the *"Featured"* badge.

---

## 📋 4. How to Manage Customer Orders

1. Open **Orders** (`/admin/orders`).
2. Live orders appear with real-time status, customer name, delivery address, ordered items, and payment mode (`COD` or `ONLINE`).
3. **Order Status Workflow:**
   * **Pending:** Newly submitted customer order. Click **Accept & Confirm**.
   * **Confirmed:** Kitchen acknowledges order.
   * **Preparing:** Meal is actively being cooked in desi cow ghee.
   * **Out for Delivery:** Delivery rider is en route.
   * **Delivered:** Tiffin handed to customer.
4. **Order History Trail:** Every status transition records the timestamp and acting user in the order's immutable history audit log.

---

## 💵 5. Managing Cash on Delivery (COD) & Online Payments

* **Cash on Delivery (COD):**
  * When a customer places a COD order, the order is created with `paymentStatus: "Pending"`.
  * Once your rider collects physical cash at the doorstep, open the order or **Payments** (`/admin/payments`) and click **Record Cash Collected**.
  * The payment status will instantly transition to `"Paid"`.
* **Online Payments (Razorpay):**
  * Online payments are processed through Razorpay.
  * Payment amounts are derived authoritatively from the server database order total.
  * Successful payments are cryptographically verified via HMAC-SHA256 signatures before updating the order status.

---

## 👥 6. Customer Directory & Analytics

* **Customer Directory (`/admin/customers`):** View customer profiles, delivery addresses, phone numbers, total orders, and lifetime spending.
* **Business Analytics (`/admin/analytics`):**
  * Monitor realized revenue, delivered orders, and Average Order Value (AOV).
  * Inspect peak ordering hours and weekday order distributions to plan kitchen preparation.
  * Review cost breakdowns (ingredients, packaging, delivery) and estimated net profit.

---

## ⚙️ 7. Business Settings & Pausing Orders

1. Open **Settings** (`/admin/settings`).
2. **Pause Orders:** If the kitchen reaches maximum capacity, toggle *"Accepting Orders"* to **OFF**. 
   * Customers attempting to order will see your customized message (e.g., *"Kitchen is currently full. We reopen tomorrow at 7:00 AM."*).
3. **Delivery Radius & Fee:** Adjust delivery radius (in kilometers) and base delivery fee as needed.
4. **Business Hours:** Configure kitchen opening and closing times per weekday.

---

## 🛡️ 8. Secure Owner Onboarding & Password Management

### Provisioning the Real Business Owner:
Run the production onboarding CLI script locally or in the deployment console:
```bash
node server/scripts/onboard-owner.js --email "[CLIENT OWNER EMAIL]" --password "[SECURE PASSWORD]" --name "[OWNER NAME]" --phone "[OWNER PHONE]" --deactivate-demo
```

### Password Guidelines:
* Minimum 8 characters.
* Must contain at least one uppercase letter, one lowercase letter, and one number.
* Passwords are encrypted using salted bcrypt hashing (10 rounds). Plaintext passwords are **never** stored or returned in API responses.

---

## 🚨 9. Security Rules — What Must NEVER Be Shared

| Secret / Credential | Safe Storage | NEVER Put In |
| :--- | :--- | :--- |
| **Owner Password** | Render Dashboard / CLI prompt | Chat, Git, Email, Frontend Code |
| **JWT_SECRET** | Render Environment Variables | GitHub, public commits, client bundles |
| **MONGO_URI** | Render Environment Variables | Public repos, client code |
| **RAZORPAY_KEY_SECRET** | Render Environment Variables | Frontend code (`VITE_` variables) |

*Note: The frontend static site receives ONLY the public `VITE_RAZORPAY_KEY_ID`.*

---

## 📚 10. Operational Documentation References

* **Database Backup & Disaster Recovery:** [docs/PRODUCTION-BACKUP-RECOVERY.md](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/docs/PRODUCTION-BACKUP-RECOVERY.md)
* **Full Cloud Deployment Guide:** [docs/DEPLOYMENT.md](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/docs/DEPLOYMENT.md)
* **Production Launch Checklist:** [docs/PRODUCTION-CHECKLIST.md](file:///c:/Users/abc/Desktop/Shree%20tiffin%20service/docs/PRODUCTION-CHECKLIST.md)

---

## 🛠️ 11. Troubleshooting & Support

* **Service Status Check:** Visit `https://shree-tiffin-api.onrender.com/api/health`. If `status` is `"online"` and `database` is `"connected"`, the backend is operating normally.
* **Server Restart:** If configuration changes are made in Render, trigger **Manual Deploy $\to$ Deploy latest commit** from the Render Dashboard.
* **Customer Support Inquiries:** Contact support through the configured business email and phone number in Business Settings.
