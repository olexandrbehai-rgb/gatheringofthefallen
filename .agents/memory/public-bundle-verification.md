---
name: Public bundle verification
description: Deployment verification when Render and Replit publishing are both involved.
---

Treat a successful Render deploy as separate from the public Replit-published build. Verify the actual custom-domain HTML and JavaScript bundle before saying a frontend change is live; publish the Replit build when the public bundle is stale.

**Why:** The Render service can report a live commit while the public custom domain still serves the previous Replit artifact.

**How to apply:** Compare the public bundle for a distinctive changed string or asset, and use the publishing action when it does not match the current source.