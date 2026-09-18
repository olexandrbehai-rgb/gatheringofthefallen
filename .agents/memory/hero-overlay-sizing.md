---
name: Hero overlay sizing
description: CSS layering and sizing constraints for the first-section hero overlay.
---

The hero's outer wrapper must own the section overlay positioning, while a nested wrapper owns the positioning context for the canvas and fallback poster. Do not put a base `relative` utility on the same element that receives `absolute` from its caller; this project's generated utility order can let `relative` win, turning the overlay into a full-height flow block.

**Why:** The hero disappeared when its container had no generated viewport-height utility, then pushed the first-section content below the fold when a conflicting `relative` utility prevented the intended absolute positioning.

**How to apply:** Use an available viewport-height utility such as `h-svh` for the outer overlay, keep `pointer-events-none`, and verify that the section content remains visible above/beside the transparent canvas on desktop and mobile.

The current hero requirement is an autoplaying animated hero in the fixed background layer, while the GOTF logo is the first normal-flow element in the scrolling album composition: keep the color video and grayscale-mask compositing, with the hero independent from scrolling album content.

**Why:** The hero should visibly run toward the viewer on the bridge while staying attached to the fixed background; the logo should remain part of the album composition and scroll with it.

**How to apply:** Keep playback driven by the media loop, render all heroes in the layout's fixed background layer beneath page content, use the original grayscale mask for the first hero and a low-threshold temporally stable key for the three black-background heroes, render the logo before the album grid in normal flow, trim each hero two seconds early, and leave a three-second interlude before the next hero.