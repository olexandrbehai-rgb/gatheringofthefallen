---
name: Author portals
description: Public author profiles, owner-only editing, and platform-specific work cards.
---

Author identity is handled by Clerk; the app must never store author passwords. PostgreSQL stores only the public profile, stable portal slug, world position, and work cards.

**Why:** Authors asked for ordinary email/password registration while keeping their important profile data private from other editors and making published work freely readable.

**How to apply:** Keep public profile and work routes read-only unless the authenticated Clerk user owns the author row. Group work cards by the selected platform; YouTube cards can derive a thumbnail from a public video URL without requiring a YouTube API key.

Large work libraries should be rendered in pages of 24 cards with search and lazy-loaded previews; the owner editor should keep its work list independently scrollable.

**Why:** A single author may publish hundreds of linked videos, and a full eager grid makes the public profile and editor slow and difficult to navigate.

**How to apply:** Reset the visible-card window when the platform or search changes, then offer incremental loading without deleting or hiding the remaining saved works.