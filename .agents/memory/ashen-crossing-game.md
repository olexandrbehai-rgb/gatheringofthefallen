---
name: Ashen Crossing game
description: Durable architecture and platform constraints for the site's integrated platformer.
---

The site's game is intentionally self-contained in the web artifact: level data drives a canvas renderer and game loop, while keyboard, mouse, touch, browser Gamepad API, fullscreen, and procedural Web Audio avoid external game assets and physics dependencies.

**Why:** The game needs to feel like a classic platformer without copying Nintendo assets or requiring a separate product, and the same controls must work across desktop and mobile layouts.

**How to apply:** Keep new levels and difficulty changes data-driven in the game data module; preserve the 16:9 logical world and scale it to the responsive canvas. Treat physical gamepad and mobile fullscreen behavior as device-level test coverage rather than assuming the desktop preview proves them.

The first six levels use only the procedural scene; uploaded background art begins with the second six-level group and continues through later biomes.

**Why:** The first uploaded artwork was removed from the opening scene, so the game must not draw any replacement image there; later cinematic art can still mark progression by region.

**How to apply:** Assign future background sets by biome group rather than per-frame random selection; keep the readability overlay over every background so gameplay objects remain legible.

The opening route is deliberately beginner-friendly: early platforms use wide, low steps, and holding jump should be enough to keep moving without frame-perfect taps.

**Why:** The intended audience may have no platformer experience, so the first levels should teach movement through forgiving geometry rather than hidden timing tricks.

**How to apply:** Preserve the generous opening route when tuning physics or adding early levels; reserve tighter jumps and more demanding timing for later progression.