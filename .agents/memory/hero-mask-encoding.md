---
name: Black-background hero masks
description: Reliable transparency handling for the generated hero videos with black backgrounds and black costumes.
---

Use precomputed per-frame masks for black-background hero footage when the subject also has black hair or clothing. A runtime brightness key cannot distinguish those regions from the background without making the hero partially transparent or adding a halo. Encode generated mask videos as browser-compatible H.264 with yuv420p; OpenCV's default mp4v output may load in tooling but fail to decode in the browser. When skipping intro frames, seek only after media metadata is available and suppress drawing until both color and mask videos reach the target time.

**Why:** The generated heroes include dark costumes and hair, so thresholding or component filtering removed real body details. Browser support for the initial mask encoding was also insufficient, leaving the entire canvas blank.

**How to apply:** Keep color and mask videos synchronized, preserve the fixed background layer, and validate both the mask codec and an actual browser load before tuning visual matte parameters.