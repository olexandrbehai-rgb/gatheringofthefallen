---
name: Owner activity access
description: Security boundary and environment behavior for the private activity dashboard.
---

The private activity dashboard requires both the Clerk-authenticated allowlisted owner email and the signed trusted-device cookie registered for that email. A new device must not silently replace the registered device.

**Why:** The dashboard contains private site activity, so a hidden frontend route or email-only check is not sufficient. Clerk's frontend proxy is only needed in production; enabling the proxy URL during development causes failing proxy health requests because the development middleware intentionally bypasses proxying.

**How to apply:** Keep owner authorization on the API endpoint, keep the trusted-device record persistent in PostgreSQL, and pass Clerk's proxy URL only when the frontend is built for production. Recovery may bypass the device cookie only for the allowlisted Clerk owner and after explicit confirmation; rotate the stored token instead of adding a second device.