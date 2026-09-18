---
name: Render Oracle fallback
description: Why production Oracle uses a Replit gateway fallback when Render cannot reach the Replit AI proxy.
---

Production Render keeps the direct OpenAI integration as the first path and falls back to the public Replit deployment's Oracle endpoint when that path fails.

**Why:** The Replit AI integration succeeds inside the Replit runtime but can fail from Render even when the copied environment variables are present; the fallback keeps the real Oracle available rather than returning a generic 502.

**How to apply:** Keep the Replit production gateway deployed and working when changing the Render Oracle route. Do not replace the fallback with mock responses or point it at the Render custom domain, which would recurse back into the same request.