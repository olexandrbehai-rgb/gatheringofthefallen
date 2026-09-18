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
- Oracle uses Replit AI integration env vars (`AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`); Render does not inherit them automatically, so populate them in the Render service before deploying.
- Keep `drizzle-kit push` out of the deploy build command. Render Dashboard can retain a manual Build Command that overrides `render.yaml`; verify and remove stale `pnpm --filter @workspace/db run push` there when logs still show it.
- Clerk-backed production health checks require `CLERK_SECRET_KEY`; the frontend build also requires `VITE_CLERK_PUBLISHABLE_KEY`, with `CLERK_PUBLISHABLE_KEY` used by the API.
- The Render service may retain a stale DATABASE_URL after a managed database replacement; verify the live host and required activity/owner tables before diagnosing owner access.
- Render's external PostgreSQL URL needs an explicit `sslmode=verify-full`; Node `pg` otherwise fails with `SSL/TLS required` and owner routes return 503.

**Rule:** Verify the active service settings in Render logs instead of assuming edits to `render.yaml` update an existing service.

**Why:** The existing Render service kept its dashboard-configured build command, including `drizzle-kit push`, after `render.yaml` changed. GitHub updates also did not consistently trigger an automatic deploy.

**How to apply:** Read the checked-out commit and full build command at the top of each Render log. If the latest GitHub commit is not deployed, use **Manual Deploy → Deploy latest commit**; change dashboard build settings directly when they differ from the Blueprint.

## Replit-purchased domain management

Domains purchased through Replit are managed from Replit's **Publishing → Domains** UI, even when their public DNS nameservers identify Name.com. Do not assume the owner needs a separate Name.com login or API token.

**Why:** Replit exposes DNS record editing for its purchased domains in the workspace, while the underlying registrar/provider is not necessarily an account the owner can access directly.

**How to apply:** For a Render cutover, update the Replit-managed DNS records with Render's current values, trigger Render custom-domain verification, and confirm the public HTTPS response before considering the cutover complete.
