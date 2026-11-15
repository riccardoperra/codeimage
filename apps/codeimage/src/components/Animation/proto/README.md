# Animate panel prototype (throwaway)

This prototype answers two questions about the Animate panel of PR #736.

1. Does a draggable strip timeline make sense on a phone?
2. Does the strip stay readable with many steps?

It is built on `feat/animate-new-ui` at `47d3eaf1` and will not be merged. The real build starts again from the chosen direction.

## Running it

Run the dev server and open `/` with two tabs or more. A pill appears only in dev builds. It sits at the top of the canvas on desktop and above the dock bar on phones. Click it to open the variants and the seed buttons. Alt+1 to Alt+6 also switch variants. The choice is stored in `localStorage` under `codeimage:proto-animate-variant`.

The `3 / 8 / 15 / 30 steps` buttons fill four tabs with code and build that many steps, which reuse the tabs in turn. Durations are deliberately unequal: one 10 s hold, a 0 ms hold, transitions from 100 ms to 5 s, and mixed easings. Seeded steps are not saved.

| Key | Variant | What it shows |
| --- | --- | --- |
| 1 | Strip (A, D) | The branch as it is. |
| 2 | Step list (B) | A progress-bar scrubber and one row per step showing the tab, the transition into the step with its easing glyph, and the hold. Tapping a row opens a bottom sheet on phones or a popover on desktop with Hold, Transition, Easing, Apply to all and the step actions. Nothing is dragged. |
| 3 | Preview only (C) | Phones only. Play, scrub, the header select and a row of read-only step chips. Tapping a chip seeks to that step. A hint says that timing is edited on a larger screen. Desktop falls back to the strip. |
| 4 | Fit + zoom (E) | The strip always fits the width. Labels fall back to the step number, then to nothing, as segments narrow. A `Fit / 1×` control switches to a fixed 100 px/s (60 px/s on phones) with a minimap that can be dragged. Resize handles appear only on segments wide enough to grab. |
| 5 | Overview + list (F) | A thin overview of every segment without labels, used for scrubbing. Releasing it selects that step. The step list from B is the editing surface. On desktop the rows flow into columns. |
| 6 | Combo | E on desktop, F on phones. |

## Files

All new code is in this folder. The branch changes in three places.

- `AnimatePanel.tsx` mounts the picker and picks the panel body with `surface()`.
- `SegmentDetails.tsx` exports `DurationInput`.
- `AnimatePanel.tsx` skips its Escape handler while a step editor is open.

`geometry.ts` is `timelineGeometry` with a free scale (fit, or a fixed px/ms), so `createSegmentResize` works unchanged.
