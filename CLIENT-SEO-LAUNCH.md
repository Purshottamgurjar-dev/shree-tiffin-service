# 🔍 SHREE TIFFIN SERVICE — GOOGLE SEARCH CONSOLE & SEO LAUNCH GUIDE
> **Tagline:** “Ghar Jaisa Khana, Har Din.”  
> **Target Region:** Indore, Madhya Pradesh, India  
> **Status:** Code & Markup Verified (100% Crawl Ready) ➡️ Awaiting Domain Connection & Search Console Submission  

---

## 🧭 TECHNICAL SEO STATUS (CERTIFIED)

The technical foundations for search indexing are live and verified:

| Feature | Production Verification | File / Location |
| :--- | :--- | :--- |
| **Robots.txt** | ✅ Dynamic generation + static fallback | `/robots.txt` (Disallows `/admin`, `/login`, `/register`, `/cart`, `/checkout`) |
| **Sitemap.xml** | ✅ Dynamic XML listing all active meals | `/sitemap.xml` (Prioritizes `/`, `/menu`, and real meals) |
| **Canonical URLs** | ✅ Fully dynamic via `VITE_CANONICAL_URL` | Handled by `<SEO />` component on all public views |
| **Open Graph & Twitter** | ✅ Implemented with rich preview tags | Synchronized in document `<head>` |
| **Structured Data** | ✅ JSON-LD `Restaurant` / `LocalBusiness` schema | Indore kitchen address, opening hours (07:00–22:00, 7 days), Desi Ghee pure veg cuisine |

---

## 📋 CLIENT STEP-BY-STEP GOOGLE SEARCH CONSOLE SETUP

Follow these steps when you are ready to index Shree Tiffin Service on Google:

### Step 1: Connect Custom Domain (Recommended first)
*Connecting your custom domain (e.g. `shreetiffinservice.in`) before submitting to Google ensures search equity builds on your brand name.*
1. Follow the domain setup in `render.yaml` and `CLIENT-HANDOVER.md`.
2. Ensure SSL certificate is active (`https://`).

### Step 2: Open Google Search Console
1. Go to [https://search.google.com/search-console](https://search.google.com/search-console).
2. Sign in with your official business Google account (`shreetiffinservice09@gmail.com`).

### Step 3: Add Property
1. Choose **Domain** property type (e.g. `shreetiffinservice.in`) or **URL prefix** (`https://shree-tiffin.onrender.com`).
2. If Domain: Add the TXT verification record to your domain DNS provider (GoDaddy / Hostinger / Namecheap).
3. If URL prefix: Use the HTML tag verification or HTML file upload.

### Step 4: Submit XML Sitemap
1. In the left navigation menu, click **Sitemaps**.
2. Under "Add a new sitemap", enter:
   ```text
   sitemap.xml
   ```
3. Click **Submit**. Google will crawl your homepage, menu, and meal listings.

### Step 5: Request Indexing for Key Pages
1. Use the top search bar (**URL Inspection**) and type your homepage URL.
2. Click **Test Live URL**.
3. Once verified, click **Request Indexing**.
4. Repeat for the main menu page (`/menu`).

### Step 6: Monitor Performance & Keyword Rankings
Within 7 to 14 days, your Google Search Console will begin showing search performance for local searches:
- *"best tiffin service in Indore"*
- *"homestyle food Vijay Nagar"*
- *"pure veg tiffin delivery Indore"*
- *"jain tiffin service Indore"*
