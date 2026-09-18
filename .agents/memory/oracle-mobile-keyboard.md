---
name: Oracle mobile keyboard
description: Mobile layout behavior for keeping Oracle input visible while the keyboard is open.
---

On mobile, the Oracle panel must measure the visual viewport, position itself from the viewport top above the keyboard, and shrink to the available height. Keep the message history as its own touch-scroll container and scroll that container—not the textarea or document—when keeping newly typed content visible.

**Why:** A fixed bottom panel can remain behind the mobile keyboard, hiding the text being entered and preventing the user from scrolling the conversation.

**How to apply:** Use the visual viewport only for narrow layouts, use its top/height to place the panel directly inside the visible area, preserve the desktop layout, and test focus, viewport-resize, touch scrolling, and scrolling the history to its top.