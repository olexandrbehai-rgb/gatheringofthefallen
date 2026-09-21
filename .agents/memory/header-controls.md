---
name: Header controls
description: Persistent music controls and workspace overlays in the responsive site shell.
---

Persistent site-wide controls should live inside the sticky header rather than as fixed overlays over page content. Decorative launch cards should be hidden in author workspaces and analytics views.

**Why:** Fixed controls covered forms and portal content on narrow screens, especially when the author workspace had its own panels.

**How to apply:** Keep music playback controls in the header action row; treat `/authors-world`, `/author/*`, and author analytics routes as workspace views where floating world/game launch cards are not rendered. Decorative video creatures should use their poster on mobile instead of autoplaying hidden video/canvas layers.