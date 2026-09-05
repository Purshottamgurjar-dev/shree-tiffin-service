# Shree Tiffin Service — Google Search Console & SEO Launch Runbook
### Tagline: *“Ghar Jaisa Khana, Har Din.”*

---

## 1. Overview
This document guides the business owner through verifying ownership of **Shree Tiffin Service** on **Google Search Console** and **Bing Webmaster Tools**, submitting the sitemap, and monitoring search indexing.

---

## 2. Production URL & Crawl Assets

| Resource | Default Production URL | Custom Domain URL (When Bound) |
| :--- | :--- | :--- |
| **Website Homepage** | `https://shree-tiffin.onrender.com/` | `https://www.shreetiffinservice.com/` |
| **Robots Directives** | `https://shree-tiffin.onrender.com/robots.txt` | `https://www.shreetiffinservice.com/robots.txt` |
| **XML Sitemap** | `https://shree-tiffin.onrender.com/sitemap.xml` | `https://www.shreetiffinservice.com/sitemap.xml` |

---

## 3. Google Search Console (GSC) Setup & Verification

### Step 1: Add Property in Google Search Console
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Sign in with the official business Google account.
3. Click **Add Property**:
   - **Option 1 (Recommended for Custom Domain)**: Choose **Domain** property and enter `shreetiffinservice.com`.
   - **Option 2 (URL Prefix)**: Choose **URL prefix** and enter `https://shree-tiffin.onrender.com` (or your custom HTTPS URL).

### Step 2: Ownership Verification Methods

#### Method A: DNS TXT Record (Best for Custom Domains)
1. In GSC, copy the provided `google-site-verification=...` TXT record string.
2. Log in to your domain DNS registrar (GoDaddy, Namecheap, Cloudflare, etc.).
3. Add a new **TXT record**:
   - **Host / Name**: `@` (or leave blank)
   - **Type**: `TXT`
   - **Value / Content**: Paste the copied verification token.
   - **TTL**: Auto or 300 seconds.
4. Return to GSC and click **Verify**. (DNS propagation may take 5–15 minutes).

#### Method B: HTML Meta Tag (For URL Prefix / Render)
1. Select **HTML tag** in GSC and copy the meta tag:
   `<meta name="google-site-verification" content="YOUR_UNIQUE_TOKEN" />`
2. Add this tag into `client/index.html` inside `<head>`, or provide your token to deployment settings.
3. Re-deploy and click **Verify** in GSC.

---

## 4. Submitting Your XML Sitemap

Once verification succeeds:
1. In the left navigation sidebar of Google Search Console, click **Sitemaps** (under Indexing).
2. Under **Add a new sitemap**, enter:
   `sitemap.xml`
3. Click **Submit**.
4. GSC will fetch and process your sitemap. The status will update to **Success** and display the count of discovered public URLs (`/`, `/menu`, `/login`, `/register`, and active meals).

---

## 5. Requesting Priority Indexing for Key Pages

1. In the top search bar of GSC ("Inspect any URL in..."), enter your homepage URL:
   `https://shree-tiffin.onrender.com/` (or custom domain).
2. Wait for the URL inspection to complete.
3. Click **Request Indexing**.
4. Repeat for the main menu page:
   `https://shree-tiffin.onrender.com/menu`.

---

## 6. Public Pages vs. Disallowed Private Pages

### ✅ Pages Included in Indexing & Sitemap
- `/` (Home page)
- `/menu` (Homestyle Food Menu)
- `/menu/:id` and `/meal/:id` (Real active meals with Product structured data)
- `/login` (Customer login)
- `/register` (Customer registration)

### 🔒 Pages Protected with `noindex, nofollow`
Search crawlers are explicitly instructed **not** to index private customer or owner workflows:
- `/admin/*` (All kitchen management, delivery dispatch, and analytics views)
- `/cart` (Shopping cart)
- `/checkout` (Order checkout and payment gateway)
- `/orders` & `/orders/:id` (Customer personal order histories)
- `/profile` (Customer profile and delivery addresses)
- `/notifications` (Customer real-time alerts)

---

## 7. Connecting a Custom Domain (Future Step)

When you purchase or connect a domain (e.g. `www.shreetiffinservice.com`):
1. **Render Dashboard**: Go to Static Site `shree-tiffin` $\rightarrow$ **Settings** $\rightarrow$ **Custom Domains** $\rightarrow$ Add `www.shreetiffinservice.com` and `shreetiffinservice.com`.
2. **DNS Setup**: Add the CNAME record pointing to `shree-tiffin.onrender.com`.
3. **Environment Variable**: Set `VITE_CANONICAL_URL=https://www.shreetiffinservice.com` in Render Static Site environment variables.
4. **Backend CORS**: Add your custom domain to `CLIENT_URL` in the Backend Web Service dashboard:
   `CLIENT_URL=https://shree-tiffin.onrender.com,https://www.shreetiffinservice.com`
5. **GSC Property**: Add the new custom domain property in Google Search Console and submit `sitemap.xml`.

---

## 8. Ongoing Search Health Monitoring
- Check **Page Indexing** report monthly to verify no 404 or server 500 errors occur on public routes.
- Check **Core Web Vitals** report to ensure mobile performance remains fast across all Android and iOS devices.
- If any menu item is permanently retired, the system automatically marks it out-of-stock without breaking existing canonical search links.
