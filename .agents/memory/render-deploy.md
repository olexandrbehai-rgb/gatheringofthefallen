---
name: Render deployment
description: How this project is deployed to Render.com and why it must be single-origin
---

# Render deployment shape

This project deploys to Render as a **single web service** plus a managed Postgres database (see `render.yaml`).

**Rule:** frontend and API must share one origin.

**Why:** the generated API client (`lib/api-client-react`) calls **relative** `/api/...` paths and does not prepend any base URL. Only `CheckoutModal.tsx` honors `VITE_API_BASE_URL`. A two-service split would break every generated hook. So in production the Express `api-server` serves the built Vite frontend (`artifacts/web/dist/public`) and the SPA fallback, gated on `NODE_ENV=production`.

**How to apply:**
- Keep the static-serving + SPA-fallback block in `artifacts/api-server/src/app.ts` (after `/api` router, production-only).
- CORS allowlist in `app.ts` must include the deploy domain. `*.onrender.com` is whitelisted; custom domains go via the `CORS_ORIGINS` env var (comma-separated). Same-origin POSTs still send an Origin header, so the deploy domain MUST be allowed or checkout/orders 500.
- Backend env vars actually read: DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLISHABLE_KEY (fallback publishable), SMTP_EMAIL, SMTP_PASSWORD. No PAYPAL_*/SESSION_SECRET are read despite paypal_* DB columns existing.
- `render.yaml` build runs `drizzle-kit push` to create tables on deploy (fine for fresh DB; prompts only on destructive schema changes).
