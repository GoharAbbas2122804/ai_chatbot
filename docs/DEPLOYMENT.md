# Vercel Deployment Guide

This guide walks you through deploying the **INDEX Systems Product Catalog Chatbot** to [Vercel](https://vercel.com) using **Next.js 16 (App Router)** and **Bun**.

---

## 1. Prerequisites Checklist

- A [Vercel account](https://vercel.com)
- A [GitHub](https://github.com) account
- Your Vercel AI Gateway key (`AI_GATEWAY_API_KEY`)

---

## 2. Push Your Code to GitHub

The repository is already initialized locally with all tests, builds, and type checks passing.

From your local machine or terminal:

1. **Verify your git status:**
   ```bash
   cd /home/goharabbas/Desktop/chatbot/chatbot
   git status
   ```

2. **Commit all final changes (if not already committed):**
   ```bash
   git add .
   git commit -m "chore(deploy): add vercel.json and deployment configuration"
   ```

3. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., `product-catalog-chatbot`)
   - Keep it **Private** (recommended) or Public
   - **Do NOT** initialize with README or .gitignore (we already have them)

4. **Add the GitHub remote and push:**
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Import Project on Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub provider and find your newly pushed repository (`product-catalog-chatbot`). Click **"Import"**.

### Project Configuration Settings:
- **Framework Preset**: `Next.js` (automatically detected)
- **Root Directory**:
  - If you pushed from inside the `chatbot` folder, leave as `./`.
  - If you pushed the parent directory that contains a `chatbot/` subfolder, set Root Directory to `chatbot`.
- **Build and Output Settings**:
  - Automatically configured by [`vercel.json`](../vercel.json):
    - Install Command: `bun install --frozen-lockfile`
    - Build Command: `bun run build`
    - Bun Runtime: `1.4.x`

---

## 4. Set Environment Variables

Before clicking **Deploy**, open the **Environment Variables** section in the Vercel import screen (or go to **Project Settings > Environment Variables** after import).

Add the following variables:

| Variable | Recommended / Default Value | Purpose |
| :--- | :--- | :--- |
| `AI_GATEWAY_API_KEY` | *(Your Vercel AI Gateway API key)* | Authenticates requests to Vercel AI Gateway |
| `AI_GATEWAY_BASE_URL` | `https://ai-gateway.vercel.sh/v1` | AI Gateway endpoint |
| `LLM_MODEL` | `nvidia/nemotron-3.5-lightning-free` | Primary model (free tier, fast 3s latency) |
| `LLM_FALLBACK_MODEL`| `openai/gpt-4o` | Fallback model if primary encounters rate limits |
| `CATALOG_CSV_URL` | `file://public/catalog.csv` | Catalog data source (bundled sample catalog or Google Sheet CSV) |
| `CATALOG_TTL_SECONDS` | `300` | In-memory cache lifetime (5 minutes) |
| `ADMIN_TOKEN` | *(Generate a 24+ char random string)* | Required to trigger `/api/admin/refresh` |
| `COMPANY_NAME` | `INDEX Precision Metrology` | Brand name displayed in AI answers & guardrails |
| `CONTACT_EMAIL` | `support@index-systems.com` | Fallback contact email for off-topic inquiries |
| `CONTACT_URL` | `https://index-systems.com/contact` | Fallback contact link |
| `IP_HASH_SALT` | *(Generate a 16+ char random string)* | Anonymizes IP addresses in audit logs |
| `ALLOWED_EMBED_ORIGINS` | `https://*.vercel.app,http://localhost:3000` | Whitelist domains allowed to iframe `/embed` |
| `LOG_QUERIES` | `false` | When `true`, logs user queries to audit stream |
| `NODE_ENV` | `production` | Production environment flag |

*(Optional: Upstash Redis)*
- If you want cross-instance sliding-window rate limiting across Vercel serverless edges, create a free Upstash Redis database (available in the Vercel Marketplace under **Integrations > Upstash**) and add:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- If omitted, the application seamlessly uses high-performance in-memory sliding window rate limiting.

---

## 5. Click Deploy & Verify

1. Click **Deploy**. Vercel will run `bun install` and `bun run build`.
2. Once the build completes, visit your live URL: `https://<your-project>.vercel.app`.

### Health & Sanity Verification:
- **Health Check**: Visit `https://<your-project>.vercel.app/api/health`
  - Expected response: `{"status":"ok", "catalog":{"status":"loaded", "itemsCount":14}, ...}`
- **Interactive Chat**: Open the homepage and test queries:
  - *"What precision collimators do you have?"* (retrieves products, renders interactive product cards with direct quotation/inquiry action)
  - *"Tell me about chocolate cake"* (cleanly rejected by L4 Catalog Gate with company contact info)
- **Embed Mode**: Test the iframe embedding route at `https://<your-project>.vercel.app/embed`.

---

## 6. Updating the Catalog in Production

When your product pricing or catalog changes:
1. **Google Sheets Option**: Set `CATALOG_CSV_URL` to your published Google Sheet CSV link. When you update the sheet, wait `CATALOG_TTL_SECONDS` or trigger an immediate refresh:
   ```bash
   curl -X POST https://<your-project>.vercel.app/api/admin/refresh \
     -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>"
   ```
2. **Git/File Option**: Update `public/catalog.csv`, commit, and push. Vercel will automatically redeploy the updated catalog.
