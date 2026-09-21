---
name: Clerk session hydration
description: The ordering rule for user-scoped API requests in Clerk-backed pages.
---

Wait until Clerk reports that authentication is loaded before making user-scoped API requests. Re-run the request when the loaded/authenticated state changes.

**Why:** A page can render the authenticated header after Clerk finishes hydration even though an earlier API request ran unauthenticated, leaving chat or profile state stale and making users think they need to sign in again.

**How to apply:** Gate initial `/me`, inbox, direct-message, notification, and profile requests on Clerk's loaded state. Keep the visible email and session indicator based on the same hydrated auth state.