---
name: image-triage
description: Use before viewing more than two images in one task, for example reviewing screenshots, comparing design variants, picking frames from a render batch, checking visual regressions, or sorting through a folder of generated images. Builds contact sheets so many images cost one view instead of many. Also use when a subagent fleet needs to look at images, or when a task involves a directory of images whose contents are unknown. Load it before the first image view, because viewing images one at a time is the cost that cannot be undone.
---

# Image triage

Viewing a full-size image adds 1 to 2 MB of context each and stalls parallel agents for minutes. Build contact sheets and view those instead.

## Build a contact sheet

Use sharp. Per sheet:

- Maximum 1024 px wide.
- JPEG, quality 70.
- 6 to 9 images per sheet.
- Burn the id or filename into each cell. Without ids the sheet is unusable for follow-up.

## Budget

- At most 3 subagents read images at once.
- At most 25 sheets per subagent.

## Reading order

1. Build the sheets first, for every candidate image.
2. View the sheets and decide which individual images matter.
3. Open a full-size image only for the few that need pixel-level judgment, and say why each one needed it.

A full-size view is a deliberate exception, not the default path.

## When a sheet is not enough

Pixel-level work (colour accuracy, 1 px alignment, text legibility at small sizes, compression artefacts) needs the original. Crop to the region of interest and view the crop, not the whole image.
