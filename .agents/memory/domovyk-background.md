---
name: Domovyk background placement
description: Placement and layering rule for the animated companion on the author-world page.
---

The domovyk must be rendered from the shared page layout on top of the author-world background image, while remaining behind the interface and author portals. Its patrol coordinates should follow visible background landmarks such as the library, waterfalls, seating, rugs, and book table; it must never be positioned in the author coordinate grid.

**Why:** The author world has two visually different layers: a fixed illustrated environment and an interactive portal/navigation field. Putting the companion in the latter makes it look like a portal and causes it to disappear or collide with author content.

**How to apply:** Keep the companion pointer-transparent and mounted at the layout/background layer for `/authors-world`. Use a modest human scale and responsive paths for desktop and narrow screens. Keep eye tracking and head movement local to the companion without adding event handlers that block portal clicks.