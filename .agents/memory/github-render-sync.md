---
name: GitHub to Render sync
description: Environment-specific constraints when synchronizing this project to GitHub and its Render service
---

Render watches the `main` branch of the project GitHub repository and auto-deploys new commits. The workspace HTTPS Git remote may not have usable Git credentials even when the Replit GitHub connector is connected, so a connector-backed GitHub API commit can be used without force-pushing.

**Why:** A local branch can diverge from GitHub while still containing the newest app work; force-pushing would risk removing GitHub-only fixes. GitHub's REST blob endpoint also rejects very large video exports, while Render does not need screenshots or preview masters to build the web app.

**How to apply:** Preserve the current GitHub `main` as the parent, upload only deployable source/assets, create a tree and commit through the connected GitHub API, and update the branch with `force: false`. Keep `video_outputs`, screenshots, and unused generated media outside that sync unless Git LFS or object storage is deliberately configured.