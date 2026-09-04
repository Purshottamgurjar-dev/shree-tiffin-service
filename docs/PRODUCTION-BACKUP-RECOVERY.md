# Shree Tiffin Service — Production Backup & Disaster Recovery Guide
### Tagline: *“Ghar Jaisa Khana, Har Din.”*

---

## 1. Overview & Architecture Separation
Shree Tiffin Service operates on a dedicated MongoDB Atlas production cluster. The database strictly enforces environment isolation:
* **Production Database**: `shree_tiffin_service`
  - Houses live customer accounts, active food orders, confirmed payment records, and kitchen operational settings.
* **Test Database**: `shree_tiffin_service_test`
  - Exclusively used for automated CI/CD and regression testing. Automated test suites strictly refuse execution if connected to any database name not ending with `test`.

---

## 2. MongoDB Atlas Backup Strategy

### 2.1 Continuous Cloud Backups
* **Automated Daily Snapshots**: MongoDB Atlas takes automated continuous backups every 24 hours.
* **Point-in-Time Restore (PITR)**: Enabled on M10+ tier clusters, allowing continuous oplog archiving and restoration down to any specific second in the preceding 7 days.
* **Retention Schedule**:
  - Daily Snapshots: Retained for 7 days.
  - Weekly Snapshots: Retained for 4 weeks.
  - Monthly Snapshots: Retained for 12 months for annual financial reporting.

### 2.2 Manual On-Demand Snapshots
Before executing any major version migration, schema overhaul, or planned maintenance window:
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Select cluster `ShreeTiffin-Prod` $\rightarrow$ **Backup** tab.
3. Click **Take Snapshot Now**.
4. Label snapshot: `STS-PRE-DEPLOY-YYYY-MM-DD-HHMM`.

---

## 3. Disaster Recovery Procedures

### 3.1 Point-in-Time Restore (PITR) Execution
In the event of accidental data corruption or catastrophic failure:
1. Navigate to **Cluster Overview** $\rightarrow$ **Backup** $\rightarrow$ **Restore Backup**.
2. Select **Point in Time Restore**.
3. Specify target timestamp immediately preceding the incident (e.g. `2026-09-04 14:30:00 UTC`).
4. Select destination:
   - *Option A (Recommended)*: Restore to a **new temporary cluster** to inspect and verify records without overwriting active connection strings.
   - *Option B*: In-place restore to existing cluster (involves brief planned downtime).
5. Verify customer accounts and pending orders.
6. Switch application `MONGO_URI` if restored to a new cluster.

### 3.2 Accidental Data Deletion Recovery
* **Single Collection Drop Recovery**:
  If a collection (e.g. `orders` or `meals`) was inadvertently dropped:
  ```bash
  # Dump collection from the nearest Atlas snapshot or PITR clone:
  mongodump --uri="mongodb+srv://<admin>:<pass>@clone-cluster.mongodb.net/shree_tiffin_service" --collection="orders" --out="./backup-dump"

  # Restore specifically the missing collection into production without dropping other collections:
  mongorestore --uri="mongodb+srv://<admin>:<pass>@prod-cluster.mongodb.net/shree_tiffin_service" --collection="orders" ./backup-dump/shree_tiffin_service/orders.bson
  ```

---

## 4. Credential Rotation & Secret Management

### 4.1 Database User Credential Rotation
1. In MongoDB Atlas, go to **Database Access**.
2. Create a secondary administrative user (e.g. `sts_app_user_v2`) with `readWriteAnyDatabase` or scoped read/write on `shree_tiffin_service`.
3. Update `MONGO_URI` in the backend hosting environment (e.g. Render Dashboard).
4. Trigger a rolling restart of the backend web service.
5. Verify `/api/health/ready` returns `200 OK`.
6. Deprecate and delete the old database user (`sts_app_user_v1`).

### 4.2 JWT Secret Key Rotation
* If `JWT_SECRET` is compromised:
  1. Generate new cryptographically random secret: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`.
  2. Update `JWT_SECRET` in hosting provider.
  3. Rolling restart invalidates existing customer session tokens, safely prompting customers and owners to re-authenticate with their credentials.

### 4.3 Razorpay Key Rotation
1. In [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys), click **Regenerate Key**.
2. Select whether the old key should expire immediately or after a 24-hour grace period.
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in server environment variables.
4. If frontend environment uses public key, update `VITE_RAZORPAY_KEY_ID` and redeploy frontend static site.

---

## 5. Security & Safety Principles
1. **Never dump production data into public or local repositories.**
2. **Never test against production connection strings.**
3. **Always sanitize database URI in logs (`mongodb+srv://***:***@...`).**
