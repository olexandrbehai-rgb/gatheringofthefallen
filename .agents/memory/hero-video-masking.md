---
name: Hero video masking
description: Browser compositing and segmentation constraints for the approaching hero video.
---

Use the color H.264 video together with a separate grayscale H.264 mask and convert mask luminance to canvas alpha pixel-by-pixel; `destination-in` alone is incorrect because a grayscale video frame is still fully opaque.

**Why:** The hero contains black armor, hair, cloak, and weapon details that must remain visible. A black/chroma key removes those details, while an AI mask can accidentally flood the background when a selected component touches the frame edge.

**How to apply:** Build the silhouette from the central connected AI-mask component, avoid flood-filling edge-connected regions, preserve the source RGB, and verify final frames on a checkerboard before web integration.

Do not apply a drop-shadow/glow filter to the transparent 9:16 canvas; CSS glow can make the canvas bounds visible as a blue rectangular frame even when the alpha mask is clean.

Always inspect the final close-up frames on a checkerboard; edge contamination can appear only when the hero reaches the lower-right canvas corner.

Do not resync the mask video on every animation frame; frequent currentTime seeks cause thin weapons and other narrow details to flicker or disappear.

When segmentation drops a moving skin-colored hand, restore only its constrained RGB skin region; do not use a broad color key that would bring back the black background.