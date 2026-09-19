---
name: Author image persistence
description: Why author icons and profile backgrounds use compressed data URLs instead of Replit-only object storage.
---

Author icons and wide profile backgrounds are resized in the browser and stored as bounded WebP data URLs in the existing profile record. This keeps both images available on Replit preview and the Render deployment, where Replit App Storage sidecar access is not guaranteed.

**Why:** The app has a single Render service serving the public site, while Replit App Storage is environment-specific; storing only an object path would make uploaded avatars disappear or fail to load in production.

**How to apply:** Keep image uploads small and validated on both client and server. Do not replace this with a Replit-only storage path unless the Render deployment is also given a durable, compatible object-storage integration.