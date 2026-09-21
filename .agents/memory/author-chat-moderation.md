---
name: Author chat mentions and moderation
description: Mention notifications and owner-only message editing/deletion in the Authors’ World chat.
---

Chat mentions are resolved server-side from stable author slugs, stored with the message, and create recipient-scoped inbox notifications. Message edits recompute mentions; deleting a message removes it and its dependent notifications.

**Why:** Chat links and notifications must not depend on client-only state, and authors need a reliable way to correct or remove their own messages.

**How to apply:** Keep ownership checks tied to the Clerk user’s author row. Preserve the SSE event contract for new messages while handling explicit updated/deleted events for later mutations.