---
name: Private author messages
description: Durable privacy and product rules for author-to-author direct conversations.
---

Private author messages must use a separate conversation/message store from the public Authors’ World chat. The server must derive the sender from the authenticated Clerk session and allow reads only when the requester owns one of the two participating author portals.

**Why:** Public chat mentions are intentionally visible to the whole author network, so a UI-only “private” mode or a mention-based workaround would expose messages to unrelated visitors.

**How to apply:** Preserve the public chat’s mention, SSE, edit, and delete behavior independently. Direct messages may use a simpler send/read/reply flow, but keep participant checks, bounded message length, and a freshness path for inbox counts.