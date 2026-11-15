# Animate

Play one tab morphing into the next, and edit the timing on a strip timeline saved with the document.

## Sub-features

Animate toggle and island in Inspector, Dock and Studio; steps seeded from the tabs on the first open; play, pause, stop and scrub; hold and transition segments with drag resize, arrow nudge and a typed duration; easing presets and a custom curve per transition, Apply to all; header mode (Current tab, Title only with a title, All tabs); Steps menu (Add to animation, Duplicate as next step, Move earlier, Move later, Remove step); preview pill that returns to the code of step N; persistence in IndexedDB for a guest.

## How to get to it (user POV)

Guest `/`, with two tabs or more to have something to play. Press Animate in the frame actions under the canvas (Inspector, Studio, Dock desktop), the play icon after More in Dock's phone bar, or the play icon in Studio's phone actions. The command menu also lists Animate, Play or pause the animation and one command per header mode. The island docks under the canvas. Saved project URLs open the classic editor, which has no Animate.

## Driving it with Playwright

Audit `animate` selects the Editor window (named Add tab), writes two tabs, clicks `[data-animate-toggle]` and waits for `[data-animate-panel]` (region `Animation`) with `aria-pressed="true"` on the toggle. Segments are `[data-animation-segment]` with `data-kind="hold"` or `"transition"`, `data-step-id`, `aria-valuenow` in ms, and `data-selected` / `data-current` as present-or-absent attributes. It clicks button `Play animation`, waits for `[data-animation-stage]:visible` and `[data-preview-pill]`, waits for `[data-animation-time]` to leave `0.00 s`, then clicks the pill and asserts the stage is gone and the editor holds focus. It drags the first hold's `[data-segment-resize]` with real mouse moves, asserts mid-drag that `[data-animation-track]` keeps its `data-axis-ms` while the segment's `aria-valuenow` moved to a multiple of 100, releases, asserts the axis grew by the same amount, then reloads, reopens Animate and reads the same value back.

Other proven handles: slider `Playhead` (click or drag to scrub, release keeps the position); buttons `Pause animation`, `Stop and edit the code`, `Close animation`, `Steps`, `Apply to all`; the header select is the button named `Header …` with options `Current tab`, `Title only`, `All tabs`, and textbox `Title`; `#animationDuration-input` for the selected segment; `[data-easing-trigger]` opens dialog `Easing` with tabs Smooth, Snappy, Strong, Linear, Custom, image `Easing curve`, `[data-easing-dot]` while the playhead is inside that transition, and button `Play transition`. Each scene is a `[data-animation-scene]`; only the shown one is not `display: none`, and its header tabs carry `data-active`. Count saves by wrapping `IDBObjectStore.prototype.put` in an init script and filtering key `document`; the saved shape is `document.animation` in the `keyval-store` database.

Source: `components/Animation/` (`AnimatePanel.tsx`, `TransportBar.tsx`, `StripTimeline.tsx`, `createSegmentResize.ts`, `SegmentDetails.tsx`, `EasingField.tsx`, `EasingCurve.tsx`, `HeaderField.tsx`, `StepsMenu.tsx`, `AnimationPreview.tsx`, `PreviewPill.tsx`, `planPreview.tsx`), `state/editor/animation.ts`, `state/editor/animationSettings.ts`, `core/animation/easing.ts`, `core/animation/timeline.ts`, `pages/UnifiedEditor/stage.tsx`, `pages/UnifiedEditor/variants/*/index.tsx`, `i18n/animation.ts`.

## Gotchas

Drive it through the controls. `scripts/parity/live-animate.ts` seeds tabs, seeks and focuses through the store, so it misses what a user hits: check the same journeys from the toggle, the Play button and the pointer.

A click that succeeds does not prove a control is visible. Playwright scrolls `overflow: hidden` boxes, and the kit popover clips its content, so compare each control's box with the dialog's box and the viewport, and look at the screenshot. Check that the curve, the Custom field and Play transition sit inside dialog `Easing` in every layout and at 390×844.

Assert displayed values, not only stored ones: after selecting a segment, `#animationDuration-input` must show its duration. Type into it with the keyboard (`fill()` is wrong on the kit's masked field) and commit with Enter or Tab.

Steps join only on the first open. A tab added later needs Steps → Add to animation. With nothing selected the Steps menu acts on step 1. Removing, adding or moving a step while the preview is paused replans from the previous measurement, so repeat those actions while paused and while playing, and fail on any `pageerror`.

Typed keys reach the code only while the preview stage holds focus. After a click on Play the focus stays on the button and the app's letter hotkeys (B, P, D, H, W, F) still fire, so test typing from both places. Clicking the stage focuses it; only the pill, Enter, Esc or a printable key returns to the code.

In the default macOS window the add button has no accessible name and every `[data-host-index]` tab exists twice (canvas and export copy). A save is debounced: wait for the write before reloading. The What's new nudge of a first visit covers the toggle's left edge in Inspector desktop and Dock phone. Tab order reaches the details row only after the last segment, and focus selects a segment, so check which segment the details describe when you arrive by keyboard. Audit covers open, play, pill and one resize with reload in Inspector at desktop size; easing, header, Steps, keyboard, the other layouts and phone need targeted proof.
