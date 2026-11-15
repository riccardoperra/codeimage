# Animate

Play one tab morphing into the next, and edit the timing on a strip timeline saved with the document.

## Sub-features

Animate toggle and island in Inspector, Dock and Studio; steps seeded from the tabs on the first open; play, pause, stop and scrub; hold and transition segments with drag resize, arrow nudge and a typed duration; easing presets and a custom curve per transition, Apply to all; header mode (Current tab, Title only with a title, All tabs); Steps menu (Add to animation, Duplicate as next step, Move earlier, Move later, Remove step); preview pill that returns to the code of step N; persistence in IndexedDB for a guest.

## How to get to it (user POV)

Guest `/`, with two tabs or more to have something to play. Press Animate in the frame actions under the canvas (Inspector, Studio, Dock desktop), the play icon after More in Dock's phone bar, or the play icon in Studio's phone actions. The command menu also lists Animate, Play or pause the animation and one command per header mode. The island docks under the canvas. Saved project URLs open the classic editor, which has no Animate.

## Driving it with Playwright

Audit `animate` selects the Editor window (named Add tab), writes two tabs, clicks `[data-animate-toggle]` and waits for `[data-animate-panel]` (region `Animation`) with `aria-pressed="true"` on the toggle. Segments are `[data-animation-segment]` with `data-kind="hold"` or `"transition"`, `data-step-id`, `aria-valuenow` in ms, and `data-selected` / `data-current` as present-or-absent attributes. It clicks button `Play animation`, waits for `[data-animation-stage]:visible` and `[data-preview-pill]`, waits for `[data-animation-time]` to leave `0.00 s`, then clicks the pill and asserts the stage is gone and the editor holds focus. It drags the first hold's `[data-segment-resize]` with real mouse moves, asserts mid-drag that `[data-animation-track]` keeps its `data-axis-ms` while the segment's `aria-valuenow` moved to a multiple of 100, releases, asserts the axis grew by the same amount, then reloads, reopens Animate and reads the same value back.

Other proven handles: slider `Playhead` (click or drag to scrub, release keeps the position); buttons `Pause animation`, `Stop and edit the code`, `Close animation`, `Steps`, `Apply to all`; the header select is the button named `Header …` with options `Current tab`, `Title only`, `All tabs`, and textbox `Title`; `#animationDuration-input` for the selected segment; `[data-easing-trigger]` opens dialog `Easing` with tabs Smooth, Snappy, Strong, Linear, Custom, image `Easing curve`, `[data-easing-dot]` while the playhead is inside that transition, and button `Play transition`. Each scene is a `[data-animation-scene]`; only the shown one is not `display: none`, and its header tabs carry `data-active`. Count saves by wrapping `IDBObjectStore.prototype.put` in an init script and filtering key `document`; the saved shape is `document.animation` in the `keyval-store` database.

Source: `components/Animation/` (`AnimatePanel.tsx`, `TransportBar.tsx`, `StripTimeline.tsx`, `createSegmentResize.ts`, `SegmentDetails.tsx`, `EasingField.tsx`, `EasingCurve.tsx`, `HeaderField.tsx`, `StepsMenu.tsx`, `AnimationPreview.tsx`, `PreviewPill.tsx`, `planPreview.tsx`, `createPreviewSnapshot.ts`), `state/editor/animation.ts`, `state/editor/animationSettings.ts`, `core/animation/easing.ts`, `core/animation/timeline.ts`, `pages/UnifiedEditor/stage.tsx`, `pages/UnifiedEditor/variants/*/index.tsx`, `i18n/animation.ts`.

## Gotchas

Drive it through the controls. `scripts/parity/live-animate.ts` seeds fixtures through the store. Its regression lanes use the visible controls for step removal, playback and commands, keyboard details, custom easing commits, and long-strip scrolling. Older Header/Pill/Scrub cases still seek through the store; audit covers opening and playback from the user entry points.

A click that succeeds does not prove a control is visible. Playwright scrolls `overflow: hidden` boxes, and the kit popover clips its content, so compare each control's box with the dialog's box and the viewport, and hit-test their centers and edges before clicking them. The Easing lane checks the curve, Custom field, validation message and Play transition. Check that the curve, the Custom field and Play transition sit inside dialog `Easing` in every layout and at 390×844.

Assert displayed values, not only stored ones: after selecting a segment, `#animationDuration-input` must show its duration. Type into it with the keyboard (`fill()` is wrong on the kit's masked field) and commit with Enter or Tab. Enter preserves focus. Custom easing also commits on blur; entering a preset’s points keeps the Custom field mounted.

Steps join only on the first open. A tab added later needs Steps → Add to animation. With nothing selected, Duplicate, Move and Remove are disabled. Preview planning pairs settings with their matching measurement snapshot; timing-only edits reuse the measurement. RemoveDuringPreview removes each of three steps while paused and playing, checks menu closure and the remaining strip, and waits for IndexedDB to contain the removal. Fail on any `pageerror` or nonexistent-droppable warning.

Typed keys reach the code only while the preview stage holds focus. Play, Play transition and the playback command move focus to the stage, so printable keys edit the current step and bypass app hotkeys. PlayFocus checks both the Play button and command menu. Clicking the stage focuses it; only the pill, Enter, Esc or a printable key returns to the code.

In the default macOS window the add button has no accessible name and every `[data-host-index]` tab exists twice (canvas and export copy). A save is debounced: wait for the write before reloading. The What's new nudge of a first visit covers the toggle's left edge in Inspector desktop and Dock phone. The strip has one tab stop. Up/Down, Home/End move selection; Left/Right nudge its duration (Alt uses 10 ms). Tab reaches that segment’s duration, then the kit’s number steppers, Easing and Apply to all. Long strips scroll the ruler and segments together, with the time scale frozen during resizing. Controls checks 40 px phone buttons and Settings segmented-control Escape behavior. The Animate command focuses its panel or toggle. Audit covers open, play, pill and one resize with reload in Inspector at desktop size; easing, header, Steps, keyboard, the other layouts and phone need targeted proof.
