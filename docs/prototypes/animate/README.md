# Animate panel prototypes

Throwaway prototypes for the Animate panel of the new editor UI. They exist so Riccardo can pick a design on five axes before A3 (#727) ships in the new UI (#711). Nothing here is the production build.

The branch `proto/animate-ui` is `feat/ui-prototypes` with `feat/a3-animation-preview` merged in. Each route shows one axis, with 2 or 3 variants behind the picker pill from the `prototype` skill (`prototypes/editor-controls/picker/Picker.tsx`, reused as is). Number keys and the arrows switch variants, `R` replays. Everything that is not on the route's axis stays the same between its variants.

Every variant plays the real animation: A3's `planPreview` and the core's `planTimeline`, through `prototypes/animate/Preview.tsx`, a copy of A3's `AnimationPreview` driven by the prototype's store.

## Run it

From the repository root, on Node 24 for Vite:

```sh
git fetch origin proto/animate-ui
git switch proto/animate-ui
pnpm install --frozen-lockfile
pnpm libs:build
cd apps/codeimage
rm -rf node_modules/.vite
fnm exec --using=v24.14.0 ./node_modules/.bin/vite --port 4377 --strictPort
```

Then open any of:

- http://localhost:4377/prototypes/animate-timeline
- http://localhost:4377/prototypes/animate-edit-mode
- http://localhost:4377/prototypes/animate-easing
- http://localhost:4377/prototypes/animate-header
- http://localhost:4377/prototypes/animate-duration

The routes need no API: they edit the signed-out local document. If that document has fewer than two tabs, the route replaces its tabs with three demo tabs (`user.ts`, `user.ts`, `user.test.ts`). A document with two or more tabs keeps them and the first three become the steps. `?demo` forces the demo tabs and overwrites the local document's tabs, so use it in a private window.

To capture the screenshots and videos again, start Vite with the mock API (`VITE_ENABLE_MSW=true VITE_MOCK_AUTH=true` before the command above) and run, from the repository root, with Chrome installed:

```sh
node scripts/prototypes/capture-timeline.ts http://localhost:4377/
node scripts/prototypes/capture.ts edit-mode http://localhost:4377/
node scripts/prototypes/capture.ts easing http://localhost:4377/
node scripts/prototypes/capture.ts header http://localhost:4377/
node scripts/prototypes/capture.ts duration http://localhost:4377/
```

The videos are WebM, as Playwright records them. `node scripts/prototypes/frames.ts <video> <prefix> <seconds,...>` prints a video's length and saves frames.

## What stays constant

These follow the decisions already made and hold in every variant:

- Steps come from tabs. A step has a stable id, so the same tab can appear twice. "Add to animation" adds any tab as the last step; nothing joins on its own. "Duplicate as next step" copies the selected step's tab into a new tab and inserts it after the step.
- One proportional time axis. Holds and transitions are separate segments; each transition has its own duration and easing. "Apply to all" copies the selected transition to every transition and makes it the default for new steps.
- Dragging a segment's right edge resizes it and the later segments ripple. The scale stays frozen until the pointer is released. Snapping is 100 ms, 10 ms with Alt. With a segment focused, ← and → nudge it by the same amounts.
- Only the ruler and its playhead knob scrub. Clicking a segment selects it, and the selected segment's exact numbers are editable under the timeline.
- Easing presets Smooth `cubic-bezier(0.65, 0, 0.35, 1)` (default), Snappy `(0.2, 0, 0, 1)`, Strong `(0.77, 0, 0.175, 1)` and Linear, plus a Custom text field for `cubic-bezier(...)`. y is clamped to [0, 1]. The curve is read-only. No springs.
- No fps control in the panel.
- The production header, rounded islands, rows of 36 to 40 px, `@codeui/kit` controls, popovers and menus as overlays.

Outside its own axis, every route uses Strip, Pill, a static curve, All tabs, and a 900 ms default.

## Variants and recommendations

### 1. Timeline organization (`/prototypes/animate-timeline`)

| Variant | What it is | Screenshot |
| --- | --- | --- |
| Strip | One track: hold, transition, hold, ... alternating | [timeline-strip.png](timeline-strip.png), phone [timeline-strip-390.png](timeline-strip-390.png) |
| Two rails | Holds on a top rail, transitions on a rail below, same time axis | [timeline-rails.png](timeline-rails.png) |
| Step blocks | Each step is one block: its hold joined to its outgoing transition | [timeline-blocks.png](timeline-blocks.png) |

Video: [timeline.webm](timeline.webm) (34 s).

**Recommendation: Strip.** It reads left to right like every video editor, a transition sits between the two holds it connects, and it is one 40 px row, so it fits a phone at 390 px. Two rails costs a second row and a label column, and moves each transition away from the holds it joins, so the eye has to jump rows to see what morphs into what. Step blocks match the data model (a step owns its outgoing transition), but the hold's resize edge becomes an inner seam inside the block, and the step labels add a row above the track.

### 2. Preview vs editing (`/prototypes/animate-edit-mode`)

| Variant | What it is | Screenshot |
| --- | --- | --- |
| Pill | While previewing, a pill over the canvas says "Preview · click or type to edit step N". Clicking or typing shows step N's tab in the editor, and the typed key lands in it | [edit-mode-pill.png](edit-mode-pill.png) |
| Pause on a hold | Paused inside a hold, the editor shows that step's tab and is editable at once; typing keeps the playhead. During a transition or playback the preview shows. A quiet chip in the corner says which | [edit-mode-auto.png](edit-mode-auto.png) |
| Preview ↔ Edit | An explicit segmented control in the panel. Play switches to Preview; only the control or Esc returns to Edit | [edit-mode-explicit.png](edit-mode-explicit.png) |

Video: [edit-mode.webm](edit-mode.webm) (26 s).

**Recommendation: Pill.** It names the mode and the way out in words, at the place the user is looking, and keeps A3's type-to-edit, which its live lanes already test. Pause on a hold makes a paused hold and an editable frame look the same, so the user cannot tell from the canvas whether a keystroke will edit or not, and pausing a few pixels away (on a transition) silently changes what the canvas is. Preview ↔ Edit is the clearest model on paper, but it adds a mode the user has to manage, and in Preview a keystroke does nothing, which reads as a broken editor.

### 3. Curve feedback in the easing popover (`/prototypes/animate-easing`)

Select a transition, then open its Easing control.

| Variant | What it is | Screenshot |
| --- | --- | --- |
| Curve | The curve and its two control points, read-only | [easing-static.png](easing-static.png) |
| Curve + playhead | The curve with a dot at the playhead's progress through this transition, and a "Play transition" button that plays it from just before | [easing-dot.png](easing-dot.png) |
| Curve + token | The curve with a `getUser` chip below it that crosses once, on this transition's duration and easing, each time the easing changes | [easing-chip.png](easing-chip.png) |

Video: [easing.webm](easing.webm) (30 s).

**Recommendation: Curve + playhead.** The dot ties the abstract curve to the real morph on the canvas, frame for frame, and moves only when the user plays or scrubs, so nothing animates on its own. The token chip shows motion the canvas already shows, with stand-in content, and runs on every preset change. The static curve is the right fallback if the dot proves noisy.

### 4. Window header in Animate mode and export (`/prototypes/animate-header`)

| Variant | What it is | Screenshot |
| --- | --- | --- |
| Current tab | Only the current step's tab. Two steps with the same tab name show no change in the header | [header-active.png](header-active.png) |
| Dots + title | No tabs: the window dots and an optional fixed title, typed in the panel | [header-none.png](header-none.png) |
| All tabs | Every tab of the document, the current step's highlighted (today) | [header-all.png](header-all.png) |

Video: [header.webm](header.webm) (21 s).

**Recommendation: Current tab.** The header then names the file the viewer is reading, and the demo's first two steps (both `user.ts`) morph with a still header, so the clip reads as one file evolving. All tabs shows tabs that may belong to no step and moves the highlight at each step, which competes with the code. Dots + title is the cleanest frame and suits a story told in one file; it could be an option of Current tab later rather than a mode of its own.

### 5. Default transition duration (`/prototypes/animate-duration`)

| Variant | What it is | Screenshot |
| --- | --- | --- |
| 700 ms | Every transition and the default at 700 ms | [duration-700.png](duration-700.png) |
| 900 ms | Every transition and the default at 900 ms (A3's default) | [duration-900.png](duration-900.png) |

The same three steps autoplay once when a variant mounts; `R` plays it again. Video: [duration.webm](duration.webm) (27 s).

**Recommendation: 700 ms.** This is a judgment from watching the recordings, not a measurement or a user test. Smooth is a strong ease-in-out, so most of the visible movement happens in the middle half of the transition; at 900 ms the slow start reads as a pause after the hold, and the clip is longer for a format (a GIF or a social video) that loops. Users who want slower motion set it once with "Apply to all".

## What does not work yet

- The prototype's steps live in memory. They are not saved with the document, and a reload rebuilds them from the first three tabs.
- No step reordering by drag: "Move earlier" and "Move later" stand in for it.
- The export is not wired to the prototype's steps. The header's Export still exports a still image; animation export and fps belong to the export dialog later.
- Dots + title draws the title with a CSS rule on the preview's window header, not through the window components, so the static export of a step does not show it.
- The core (`core/animation/timeline.ts`) gained an optional per-step transition and custom curves to play these prototypes. That change is on this branch only and needs its own review before A3 takes it.
- Steps edited in one variant carry over to the next variant of the same route. Reload the route for a clean start.
- A3's Animate panel also runs in the new UI's Inspector layout (`a3-in-new-ui-playing.png`), not in Dock or Studio.
