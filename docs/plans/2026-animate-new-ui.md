# Animate panel in the unified editor

The production plan for the Animate panel of the unified editor (#711). A Codex agent builds it slice by slice on `feat/animate-new-ui`. Each slice ends with its acceptance checks green and one or more commits; nothing merges without the operator's go.

## Starting point

| Ref                                             | SHA        | What it holds                                                                                        |
| ----------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `origin/feat/ui-prototypes` (#711), pinned base | `60f84ab6` | The unified editor in three layouts, with `main` merged (the animation core, #734, merge `1ffe77eb`) |
| `origin/feat/a3-animation-preview` (#727)       | `34f4d2a0` | A3: the Animate panel and the live preview on the old UI, with every review fix                      |
| `origin/proto/animate-ui`                       | `60be849d` | Throwaway prototypes of the five design axes. Read, never merged                                     |

`feat/animate-new-ui` is the pinned base with A3 merged in (`b03e39bc`). Diff, merge-base and build against the SHAs above, not against the moving remote refs.

### How the merge went

A plain merge works, so A3 keeps its history and its review trail. A3 has 45 commits on the core that #711 already holds, so only four files conflicted:

| File                                                   | Resolution                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/project/project.repository.ts`   | Union of the imports: A3's `randomUUID` and `parseAnimationSettings`, #711's `readTerminalSurface` and `writeFrameSignature`                                                                        |
| `apps/codeimage/src/i18n/index.ts`                     | Both `editorLocale` and `animationLocale` in every locale                                                                                                                                           |
| `apps/codeimage/src/state/editor/createEditorSync.ts`  | #711's file (single quotes, signature loading, `surface` default) with A3's changes: the animation store in local and remote loading, and A3's `remoteSaves` stream, which skips read-only projects |
| `apps/codeimage/src/components/Frame/PreviewFrame.tsx` | A3's split into `FrameView` and `PreviewFrame`, with #711's signature scale, signature background and window `surface` moved into `FrameView`                                                       |

One A3 test fixture (`apps/api/test/modules/project/mapper/animation.test.ts`) got the `surface` column that #711 added to the terminal. After the merge the app and the API typecheck, the app's 194 unit tests and the API's 76 unit tests pass, and oxlint is clean on the resolved files.

The classic editor (`/classic`, `/:snippetId`) now mounts A3's panel too, as A3 did. Slice 2 removes those mounts (see [Where Animate lives](#where-animate-lives)).

## Goals

- Animate ships in the unified editor, in Inspector, Dock and Studio, on desktop and on a phone.
- A3's store, preview, sync and fixes are reused. The new parts are the Strip timeline, per-transition timing, custom curves, the header mode and the preview pill.
- The settings are saved with the project, so the A4 web export and the CLI play exactly what the preview plays.
- Old documents and presets still parse.

Out of scope: the export itself (A4 web export through Takumi WASM, A5 MP4), an fps control in the panel, springs, a draggable curve, a CLI flag for the header.

## Decisions

These are final. The reason is recorded where the plan had to choose.

1. **Timeline: Strip.** One track: hold, transition, hold, … alternating, on a proportional time axis. Dragging a segment's right edge resizes it and the later segments ripple; the scale stays frozen until the pointer is released. Snap 100 ms, 10 ms with Alt. Arrow keys nudge a focused segment by the same amounts. Only the ruler and its playhead scrub. Clicking a segment selects it, and the selected segment's exact numbers are editable under the timeline. Each transition has its own duration and easing. "Apply to all" copies the selected transition to every transition and makes it the default for new steps.
2. **Edit mode: Pill.** While previewing, a pill over the canvas says "Preview · click or type to edit step N". A click, or a typed key, shows step N's tab in the editor, and the typed key lands there.
3. **Easing popover: Curve and playhead.** A read-only curve with its control points, a dot at the playhead's progress through this transition, and a "Play transition" button. Presets Smooth `cubic-bezier(0.65, 0, 0.35, 1)` (default), Snappy `(0.2, 0, 0, 1)`, Strong `(0.77, 0, 0.175, 1)`, Linear, plus a Custom text field that takes `cubic-bezier(...)`, with y clamped to [0, 1]. No springs, no draggable curve.
4. **Header: a select in the panel.** "Current tab" (default: only the current step's tab, so two steps with the same tab name show no header change), "Title only" (the window dots and a fixed title, typed in a text field that appears), "All tabs" (A3's behaviour, current step highlighted). Saved in the animation settings, so the export uses the same choice.
5. **Default transition: 700 ms** (was 900).
6. **Steps are tabs with stable step ids.** A → B → A is allowed. "Add to animation" adds any tab as the last step; nothing joins on its own. "Duplicate as next step" copies the selected step's tab into a new tab and inserts its step after the selected one.
7. **No fps control in the panel.** `fps` stays in the settings (default 30) and the preview keeps stepping on its frame times; the A4 export dialog sets it.
8. **Persistence** lives in the project document: the API for a signed-in user, IndexedDB when signed out.

Decided here:

- **A transition belongs to the step it leads into.** `steps[i].transition` is the morph from step `i - 1` to step `i`, and the first step's is ignored. The prototype stored the transition out of a step, which made the last step carry a hidden transition that came back, stale, when a step was appended after it. With "into", an appended step simply starts on the defaults, which is what "the default for new steps" means.
- **A step without its own transition follows the defaults** (`transitionMs`, `easing`). "Apply to all" sets the defaults and clears every override, which plays the same as copying the values to every step, keeps documents small, and leaves the top-level fields meaningful for a reader that does not know per-step transitions yet.
- **First open seeds the steps.** A document with no saved steps gets one step per tab, in tab order, the first time Animate opens. After that, tabs never join on their own. Reason: opening Animate on three tabs and seeing one step reads as broken, and the seeding is the user's own action.
- **One step is allowed.** Animate opens on a single tab (A3 hid it until there were two), so "Duplicate as next step" can start an animation from one snippet. Play is disabled with a hint until there are two steps. Removing the last step is disabled, which keeps the API's `minItems: 1`.
- **The classic editor loses Animate.** The operator decided Animate ships in the new UI. Keeping A3's panel in `/classic` would mean a second UI on a store whose model changes in slice 2.

Nothing blocks. One dependency is outside this work: the unified editor edits the local document only (`EditorHost` passes no snippet id), and `/:snippetId` still opens the classic editor. The API path is built and tested here (store, sync, contract, routes), and becomes live in the new UI when #711 serves projects. No code change is needed then.

## Data model and schema

### Persisted shape

`apps/codeimage/src/core/animation/model.ts`, which the app, the API types and the CLI's SSR entry share:

```ts
export type EasingName = 'smooth' | 'snappy' | 'strong' | 'linear';
// A preset name, or `cubic-bezier(x1, y1, x2, y2)` as formatEasing writes it.
export type EasingValue = EasingName | `cubic-bezier(${string})`;

export type AnimationStepSettings = {
  // Stable while steps move. The same tab can appear in several steps.
  id: string;
  editorId: string;
  holdMs: number;
  // The morph from the previous step into this one. Absent: the defaults.
  // Ignored on the first step.
  transition?: {ms: number; easing: EasingValue};
};

export type AnimationHeader = {mode: 'tab' | 'title' | 'tabs'; title: string};

export type AnimationSettings = {
  steps: NonEmpty<AnimationStepSettings>;
  // Defaults of every transition without its own, and of new steps.
  transitionMs: number;
  easing: EasingValue;
  fps: 24 | 30 | 50 | 60;
  header: AnimationHeader;
};
```

| Field                                   | Limits                                        | Default  |
| --------------------------------------- | --------------------------------------------- | -------- |
| `steps[].holdMs`                        | 0 to 10 000, whole ms                         | 800      |
| `transitionMs`, `steps[].transition.ms` | 100 to 5 000, whole ms                        | 700      |
| `easing`, `steps[].transition.easing`   | a preset, or a curve with x1 and x2 in [0, 1] | `smooth` |
| `header.mode`                           | `tab`, `title`, `tabs`                        | `tab`    |
| `header.title`                          | trimmed, at most 80 characters                | `''`     |
| `fps`                                   | 24, 30, 50, 60                                | 30       |

`formatEasing` writes a curve with at most three decimals and no exponent (`cubic-bezier(0.25, 0.1, 0.25, 1)`). A curve equal to a preset's points is stored as the preset's name, so the popover shows the preset as selected.

### Reading old and foreign documents

`parseDraft` in the app keeps its rule: every field is read on its own, and a missing or invalid field takes its default. New rules:

- A step without a valid `id` (1 to 64 characters) gets its `editorId`; a repeated id gets `editorId~2`, `~3`, … in order. A3's documents have one step per tab, so their ids are their tab ids, stable across reloads with no write.
- An invalid `transition` (non-finite `ms`, or an easing that does not parse) is dropped, so the step follows the defaults.
- An unknown easing, such as a future `spring`, reads as `smooth`.
- A missing `header` reads as `{mode: 'tab', title: ''}`. A3-era documents therefore change from all tabs to the current tab; A3 never reached users, so no shipped document changes.
- A missing `transitionMs` reads as 700. A stored 900 stays 900: the new default applies to new animations only.

Reconcile against the tabs, replacing A3's `reconcileSteps`: keep the steps whose tab exists, in their order, repeats included, and append nothing. If no step is left, the settings hold one step of the first tab. A timeline of 0 ms still gets the default hold on a lone step.

### API

`apps/api/src/modules/project/project.contract.ts`:

- `AnimationEasingSchema`: the four literals or `Type.String({pattern: '^cubic-bezier\\(…\\)$', maxLength: 64})`.
- Step: `id: Type.Optional(Type.String({minLength: 1, maxLength: 64}))`, `transition: Type.Optional(Type.Object({ms: Type.Integer({minimum: 1}), easing: AnimationEasingSchema}))`.
- `easing: AnimationEasingSchema`, `header: Type.Optional(Type.Object({mode: …, title: Type.String({maxLength: 80})}))`.
- `parseAnimationSettings` in `project.model.ts` sums each step's own `transition.ms`, or `transitionMs`, for the 0 ms check.

The response schemas serialize with fast-json-stringify, which drops properties the schema does not name. Every new field must be in `AnimationSettingsSchema`, or a GET returns the document without it. No Prisma migration: `Project.animation` is `Json?`. `id` and `header` stay optional so A3-shaped bodies still validate. Cloning keeps step ids and maps `editorId` as today, and repeated `editorId`s map the same way.

### What #726 adjusts when it rebases

The CLI (#726, on #707 on #702) owns these changes; this branch does not touch `packages/`:

- `packages/render/src/document.ts`: `ANIMATION_DEFAULTS.transitionMs` becomes 700. `animationSettingsSchema.easing` accepts `strong` and the `cubic-bezier(...)` form (reuse `parseEasing` from `core/animation/easing.ts` in a zod `refine`, or the same pattern). The 0 ms `superRefine` sums per-step transitions. `looseObject` already lets `id`, `transition` and `header` through.
- Tests that expect the old default: `packages/cli/src/flags/animate.test.ts` (lines 60 and 230, `transitionMs: 900`), `packages/render/src/animation.test.ts` line 268 (`800 + 900 + 800` where the defaults apply). The READMEs (`packages/cli/README.md` `--transition` default, `packages/render/README.md`) say 700.
- `packages/cli/src/flags/animate.ts`: `--easing: expected smooth, snappy, or linear` becomes `--easing: expected smooth, snappy, strong, linear, or cubic-bezier(x1, y1, x2, y2)`. `--transition` sets the default and clears per-step overrides, as "Apply to all" does.
- `apps/codeimage/src/render/entry-server.tsx`: pass each step's `transition` (parsed with `easingOf`) to `planTimeline`, and the stored `header` to `FrameView`. With no `header` the render uses the current tab, which changes the CLI's golden frames from all tabs: regenerate them.
- No `--header` flag yet.

## Changes to the core `planTimeline`

The prototype's change (`proto/animate-ui`, `b55a7280`) is the right shape: per-step timing with the options as fallback, so the CLI keeps working unchanged. Review findings, each fixed in slice 1:

1. **Ownership.** The prototype's `TimelineStep.transition` is the transition out of a step. Make it the transition into the step, to match the persisted model, and ignore it on the first step.
2. **Types.** `TimelineOptions` still `Pick`s `easing` from the persisted settings (preset names) while steps take curves. Define `TimelineOptions = {transitionMs: number; easing: Easing; fps; lineNumbers; metrics; widths}` with `Easing = EasingName | EasingCurve`, independent of the persisted type.
3. **Validation.** `curveOf` passes any tuple through. The bisection in `easedProgress` needs x1 and x2 in [0, 1] to find a single solution. `curveOf` clamps all four values to [0, 1]; the app validates before that, so the clamp is a guard.
4. **CSS numbers.** `timingFunction` joins raw floats, which can print `0.30000000000000004` or `1e-7`. Format curve points with the same three-decimal formatter as `formatEasing`, so the CSS is stable and Takumi parses it.
5. **The halfway switch.** The prototype's store finds the current step at `durationMs / 2`, while the core switches at `Math.ceil(ms / 2)`. Export `transitionHalfMs(ms)` from `timeline.ts` and use it in the store, so the pill, the header highlight and the plan agree to the millisecond.
6. **Playhead quantization.** The prototype dropped A3's stepping of the playhead on the export's frame times. Keep A3's.
7. **`easedProgress`** stays exported (pure), for the popover's dot.

Add `strong: [0.77, 0, 0.175, 1]` to `EASING_CURVES`, and a new `core/animation/easing.ts` with `parseEasing(text): EasingValue | null` (accepts a preset name, `cubic-bezier(a, b, c, d)` or four bare numbers; rejects x outside [0, 1]; clamps y), `formatEasing(curve): EasingValue`, and `easingOf(value): Easing`. The core never parses strings at plan time; callers map with `easingOf`.

Existing timeline and compile tests must pass unchanged: with no per-step transitions the output is byte-identical to today's.

## Where Animate lives

The timeline is a proportional axis and needs width. The side panels of Inspector and Studio are 300 to 360 px, and Dock has no panel at all; the canvas column is the widest region in every layout, and a timeline under the viewer is where video tools put it. So Animate is one island, the same component everywhere, docked under the canvas, and it opens and closes with an Animate toggle.

| Layout             | Island                                                                                                                                                                               | Toggle                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Inspector, desktop | In `<main class={canvas}>`, between `.stage` and `.frameActions`. The stage keeps a definite size, so `FitFrame` zooms the frame out above it. Either panel side                     | `FrameActions`                            |
| Inspector, phone   | Same place, above the bottom sheet. Opening Animate sets the sheet to `short`                                                                                                        | `FrameActions`                            |
| Dock, desktop      | Floats over the canvas, above the dock bar, like the bar (`float`). The root's `safe` inset grows by the island's measured height, so the frame fits above both and is never covered | `FrameActions` (floating, beside the bar) |
| Dock, compact      | Above the sheet's bar. The sheet and the island never open at once: opening one closes the other                                                                                     | An item in the bar, after More            |
| Studio, desktop    | In `<main>`, between `.stage` and `.frameActions`. No room in the rail: a room is a side panel, too narrow for the timeline                                                          | `FrameActions`                            |
| Studio, phone      | Above `compactActions`                                                                                                                                                               | An icon button in `compactActions`        |

The island is at most 1100 px wide, centred in the canvas column, with rounded corners and 12 to 16 px padding, on the app background like every other island.

Wiring: the `Stage` contract (`prototypes/editor-controls/stage.tsx`) gains `AnimatePanel: Component` and `AnimateToggle: Component<{iconOnly?: boolean}>`, and `Canvas` wraps `ManagedFrame` in `AnimationPreview`, as the prototype did. Layouts place `stage.AnimatePanel` and `stage.AnimateToggle`, which keeps the README's rule that layouts place stage parts. The command menu gets "Animate", "Play or pause the animation", and one command per header mode; `controls/shortcuts.ts` lists the stage's keys.

The classic editor's A3 mounts go away in slice 2: `pages/Editor/App.tsx` (panel, preview wrapper, toolbar button), `components/Toolbar/FrameToolbar.tsx`, and the two shortcut rows in `components/KeyboardShortcuts/KeyboardShortcuts.tsx`.

## Components and files

Production components stay in `apps/codeimage/src/components/Animation/`, where A3 put them, because A4 and the SSR entry use parts of them. Layout glue stays in `apps/codeimage/src/prototypes/editor-controls/` (the operator owns renaming that folder).

| File                                                                                                                                                                                 | Status | Role                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `core/animation/easing.ts`, `easing.test.ts`                                                                                                                                         | new    | Parse, format and map easings                                                                                                            |
| `core/animation/model.ts`, `timeline.ts`, `compile.ts`                                                                                                                               | edit   | Per-transition timing, `strong`, `transitionHalfMs`, curve formatting                                                                    |
| `state/editor/animationSettings.ts`, `.test.ts`                                                                                                                                      | new    | Pure: `parseDraft`, reconcile, seeding, `segmentsOf(settings)` (start and duration of every hold and transition), `stepAt(settings, ms)` |
| `state/editor/animation.ts`, `animation.test.ts`                                                                                                                                     | edit   | The store: settings, playback with `untilMs`, selection, actions                                                                         |
| `components/Frame/PreviewFrame.tsx`                                                                                                                                                  | edit   | `FrameView` takes `header?: AnimationHeader`                                                                                             |
| `components/Terminal/TerminalHost.tsx`, `MacOsTerminal`, `WindowsTerminal`, `WindowStyles`                                                                                           | edit   | `title?: string`, drawn in the header when no tab is shown                                                                               |
| `components/Animation/planPreview.tsx`                                                                                                                                               | edit   | Split into `measurePreview` (async: languages, frames, metrics) and `planPreviewTimeline` (sync: `planTimeline`)                         |
| `components/Animation/AnimationPreview.tsx`                                                                                                                                          | edit   | Measures on tab, style and header changes only; replans the timeline on timing changes; hosts the pill                                   |
| `components/Animation/PreviewPill.tsx`                                                                                                                                               | new    | The pill                                                                                                                                 |
| `components/Animation/AnimatePanel.tsx`, `.css.ts`                                                                                                                                   | new    | The island: transport row, strip, details row                                                                                            |
| `components/Animation/TransportBar.tsx`                                                                                                                                              | new    | Play/Pause, Stop, time, `HeaderField`, steps menu, close                                                                                 |
| `components/Animation/HeaderField.tsx`                                                                                                                                               | new    | Kit `Select` and, for Title only, a kit `TextField`                                                                                      |
| `components/Animation/StepsMenu.tsx`                                                                                                                                                 | new    | Kit `DropdownMenu`: Add to animation (submenu of tabs), Duplicate as next step, Move earlier, Move later, Remove step                    |
| `components/Animation/StripTimeline.tsx`, `.css.ts`                                                                                                                                  | new    | Ruler, playhead slider, segments, resize handles                                                                                         |
| `components/Animation/createSegmentResize.ts`                                                                                                                                        | new    | The drag: frozen scale, snapping, commit on release                                                                                      |
| `components/Animation/SegmentDetails.tsx`                                                                                                                                            | new    | The selected segment's numbers, easing and Apply to all                                                                                  |
| `components/Animation/EasingField.tsx`, `EasingCurve.tsx`, `easing.css.ts`                                                                                                           | new    | The popover, its curve and its dot                                                                                                       |
| `components/Animation/AnimateToggle.tsx`                                                                                                                                             | new    | Replaces `AnimateButton.tsx`                                                                                                             |
| `AnimationPanel.tsx`, `.css.ts`, `AnimationStep.tsx`, `Timeline.tsx`, `.css.ts`, `DurationField.tsx`, `AnimateButton.tsx`                                                            | delete | A3's panel, replaced                                                                                                                     |
| `prototypes/editor-controls/stage.tsx`, `variants/*/index.tsx`, `variants/*/*.css.ts`, `command-menu/commands.ts`, `controls/shortcuts.ts`, `controls/FrameActions.tsx`, `README.md` | edit   | Placement and commands                                                                                                                   |
| `i18n/animation.ts`                                                                                                                                                                  | edit   | Every new string in en, it, de, es                                                                                                       |
| `apps/api/src/modules/project/project.contract.ts`, `project.model.ts`, tests                                                                                                        | edit   | Schema                                                                                                                                   |
| `scripts/parity/live-animate.ts`                                                                                                                                                     | new    | Live lanes, ported from `live-a3.ts`, which is deleted                                                                                   |
| `scripts/parity/animation-preview.ts`                                                                                                                                                | edit   | Parity with per-step transitions and header modes                                                                                        |

Code style: named handlers declared outside the JSX, no comment that restates the code, kit controls (`Select`, `SegmentedControl` through `SegmentedField`, `TextField`, `NumberField`, `Popover`, `DropdownMenu`, `IconButton`), styles only in vanilla-extract `.css.ts` with `themeVars` from `@codeimage/ui`, rows 36 to 40 px, no hairline dividers.

### The island

Three rows, 36 px on desktop and 40 px under 769 px:

1. **Transport.** Play/Pause (primary), Stop (while previewing), the time `1.20 s / 4.10 s` (tabular digits, fixed width as A3), then on the right Header select (with the title field after it in Title only), the Steps menu, and Close. Under 769 px the header field moves to the details row.
2. **Strip.** The ruler (ticks every 0.5 s, or 1 s past 4.5 s, as the prototype) with the playhead knob, and one track of segments below it. A hold shows its step number and tab name; a transition shows its curve glyph and duration. A segment is at least 8 px wide, so a 0 ms hold stays selectable. The current segment (while previewing) and the selected one have distinct states that do not rely on colour alone.
3. **Details.** Nothing selected: a one-line hint. A hold: "Step 2 · user.ts" and a Hold `NumberField` (ms, step 100). A transition: "Step 2 → 3", a Duration `NumberField` (ms, step 100), the Easing trigger (glyph and name), and Apply to all (disabled while every transition already matches).

### Store

`createAnimationStore` keeps A3's structure, with:

- `settings`, `segments` (memo of `segmentsOf`), `durationMs`, `currentStep` (from `stepAt`), `selection: {stepId, kind: 'hold' | 'transition'} | null`, `resizing` (true while a drag runs).
- Playback: A3's state machine, with `playing` gaining `untilMs?`. The clock pauses at `untilMs` instead of the end.
- Actions: `setOpen` (seeds on first open), `select`, `addStep(editorId)`, `duplicateAsNext(stepId)` (creates the tab through `editor.actions.addEditor`, copies code, language, line start and marks, inserts the step after, selects its hold, returns to editing; disabled at the tab limit), `removeStep(stepId)`, `moveStep(stepId, -1 | 1)`, `setHoldMs(stepId, ms, {commit})`, `setTransition(stepId, {ms?, easing?}, {commit})`, `applyToAll(stepId)`, `setHeader(partial)`, `editStep(index, text?)`, `playTransition(stepId)`, `toggle`, `scrub`, `seek`, `edit`.
- `commit: false` updates the settings without emitting on `stateToPersist$`. A drag uses it on every move and commits once on release, so a drag saves once and the preview replans once.
- A step whose tab closes leaves the animation; selecting it clears the selection. A3's rule that typing in any tab returns to editing stays.

## Keyboard and focus

The app's body hotkeys (tinykeys on `document.body`: F, P, B, D, H, W, Esc) run before Solid's delegated handlers. Every handler below that swallows a key is a native `on:keydown` listener.

| Where                                     | Keys                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animate toggle                            | `aria-pressed`. Opening leaves focus on the toggle                                                                                                                                                                                                                               |
| Preview stage (focusable, `role="group"`) | Space plays or pauses. ← → step one frame, Shift+← → 100 ms. Enter or Esc returns to editing step N. A printable key returns to editing step N and lands in its tab. Ctrl, Cmd and Alt combinations pass through                                                                 |
| Pill                                      | A button; Enter or click edits step N                                                                                                                                                                                                                                            |
| Ruler                                     | `role="slider"`, labelled Playhead, `aria-valuetext` in seconds. ← → one frame, Shift 100 ms, Home and End. Pointer down scrubs, release seeks and keeps the playhead where it ended (A3's fix)                                                                                  |
| Segment                                   | One tab stop each, left to right, `role="slider"` with the min and max of its kind and `aria-valuetext` in ms. Focus selects it. ← → nudge by 100 ms, Alt by 10 ms. A hold selected while editing shows its tab in the editor; while previewing it changes nothing on the canvas |
| Resize handle                             | Pointer only; the segment's arrows are its keyboard path                                                                                                                                                                                                                         |
| Details fields                            | `NumberField` commits on Enter and blur. Esc in a `SegmentedField` keeps A3's stop at the item                                                                                                                                                                                   |
| Easing popover                            | Kit `Popover`. Opens on the selected preset. Esc closes and returns focus to the trigger. The Custom field commits on Enter; an invalid value sets `aria-invalid`, shows the reason under the field, and keeps the previous easing                                               |
| Island                                    | Esc with a selection clears it; Esc with none returns focus to the code                                                                                                                                                                                                          |

Returning to edit step N: `editStep(index, text)` ends the preview and calls `setActiveEditorId(step.editorId)`. The new tab's CodeMirror view may not exist yet, so the action waits for `activeEditorView()` to be that tab's view (one effect, disposed after the first match), focuses it, and inserts `text` with `replaceSelection` unless the view is read-only. A3's focus return for read-only code stays.

"Play transition": plays from `max(0, start - 300 ms)` and pauses at the transition's end (`untilMs`). The dot is drawn while the playhead is inside the selected transition, at `easedProgress(curve, (playhead - start) / ms)`; outside it the dot is hidden.

## Persistence

- The store already flows through `createEditorSync`: IndexedDB `document.animation` when signed out, `animation` in the update body when signed in, skipped for a read-only project (A3's `remoteSaves`). Slice 2 only changes the shape.
- Sends happen on commits only: a drag, a typed duration or a typed title saves once (the existing 150 ms and 3 s debounces still apply).
- `open`, `selection` and playback are not saved.
- A project created through the API starts with no animation, as today (the create body has no tab ids for steps to point at).

## i18n

The UI branch localizes every shipped locale: en, it, de, es. Every label, hint, tooltip, accessible name and command lands in `apps/codeimage/src/i18n/animation.ts` for all four in the slice that adds it, with `{{n}}`-style placeholders kept identical. Remove A3 keys that lose their control (`fps`, `timing`, `holdFor`, the easing segmented control's label if unused). `verify-locale-parity.mjs` scans only `prototypes/editor-controls/`; slice 7 extends its scan to `components/Animation/` so hard-coded text fails there too. Duration and time labels go through one formatter that respects the locale's decimal separator.

## Testing

Unit tests (vitest), in each slice:

- `core/animation/easing.test.ts`: presets, curves with and without `cubic-bezier`, x out of range rejected, y clamped, three-decimal formatting, a preset's points stored as its name.
- `core/animation/timeline.test.ts`: per-step durations and easings; "into" ownership; the first step's transition ignored; defaults for steps without their own; custom curve in the scene CSS; window stops with a custom curve; `transitionHalfMs` equals the scene split. Existing tests unchanged.
- `state/editor/animationSettings.test.ts`: A3-shaped documents (ids from tab ids), repeated tabs, missing tabs dropped, no auto-append, seeding, header and easing defaults, 700 only when missing, clamping, `stepAt` agreeing with `planTimeline` scenes at every boundary.
- `state/editor/animation.test.ts`: every action, commit versus no commit on `stateToPersist$`, `untilMs`.
- API: mapper tests for the new fields and for A3-shaped bodies; a route test that a GET returns `id`, `transition` and `header` (serialization); the update integration test (Docker Postgres, per the live-lane notes) round-trips them.
- Terminal: a render test of the header with `title` and no tabs.

Live lanes in Chrome (`scripts/parity/live-animate.ts`, Vite on Node 24 with `VITE_ENABLE_MSW=true VITE_MOCK_AUTH=true`, signed out at `/`, each layout through `?v=2`, `?v=3`, `?v=4`, at 1440×900 and 390×844). Firefox and WebKit are skipped for now.

| Lane        | Checks                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Placement   | Toggle opens and closes the island in every layout and size; the island does not cover the frame; Dock's frame stays above both bars                                           |
| Playback    | Play, pause, stop; Space on the stage; time readout; stop returns focus to code                                                                                                |
| Scrub       | Ruler drag moves the playhead and release keeps it; clicking a segment selects it and does not seek                                                                            |
| Resize      | Drag ripples later segments while the axis stays put until release; 100 ms snap, 10 ms with Alt; one save per drag                                                             |
| Nudge       | Arrows on a focused segment; typing in a `NumberField` with the keyboard (Playwright `fill()` is wrong on the kit's maskito field)                                             |
| Easing      | Presets; Custom valid, invalid and clamped; dot follows a scrub; Play transition plays and stops at the end; Apply to all                                                      |
| Pill        | Visible only while previewing; click edits step N; a typed key lands in step N's tab; Esc and Enter on the stage                                                               |
| Header      | Each mode in the preview's DOM; two same-name steps show identical header pixels across their transition; title field                                                          |
| Steps       | Add a tab as the last step; A → B → A; Duplicate as next step inserts after and creates the tab; move; remove; closing a tab drops its steps; a new tab does not join          |
| Persistence | Reload restores steps, transitions, easing and header from IndexedDB                                                                                                           |
| Hotkeys     | F, P, B, D, H, W typed in the title field and on the stage do not reach the app's hotkeys                                                                                      |
| i18n        | `verify-locale-parity.mjs`, and `verify-i18n.mjs` with the island open, in it, de, es                                                                                          |
| Parity      | `scripts/parity/animation-preview.ts`: each hold matches its static frame, and transitions match Takumi frames, with per-step transitions, a custom curve and each header mode |

Every slice also runs, from a clean tree: `pnpm libs:build`, `pnpm --filter @codeimage/api build:ts`, app and API typecheck, app and API unit tests, oxlint on touched files, oxfmt on touched files (re-apply only your hunk where oxfmt rewrites a whole file), and `git checkout -- pnpm-lock.yaml` if pnpm rewrote it.

## Slices

Each slice is one or more commits with scopes `app` or `api` (commitlint has no `cli` or `render` scope). The branch typechecks and its tests pass after every slice.

### Slice 0. Branch (done)

`feat/animate-new-ui` = `60f84ab6` + A3 `34f4d2a0`, merge commit `b03e39bc`, and this plan.

### Slice 1. Core: per-transition timing and curves

`core/animation/model.ts`, `easing.ts`, `timeline.ts`, `compile.ts` and their tests, per [Changes to the core](#changes-to-the-core-plantimeline). `planPreview` passes nothing new yet.

Accept when: existing core tests pass unchanged; the new easing and timeline tests pass; a timeline with all-default transitions is byte-identical to `main`'s for the fixtures in `timeline.test.ts`.

### Slice 2. Data model, store and API

`state/editor/animationSettings.ts`, the store changes, the API contract and model, and the removal of the classic mounts and A3's panel components (the preview stays and adapts to the new settings, playing per-step transitions and the stored header through `FrameView`). The Inspector keeps no Animate UI between this slice and slice 4, which is fine on a draft branch.

Accept when: unit tests for parsing, reconcile, seeding and actions pass; API mapper, serialization and update integration tests pass; an A3-shaped document from the A3 test fixtures loads with ids equal to its tab ids; a document saved by this slice reloads with the same steps, transitions and header.

### Slice 3. Preview: header modes, split planning, pill, edit step N

`FrameView` header modes and the terminal `title`; `measurePreview` and `planPreviewTimeline`; `AnimationPreview` measures on content changes and replans on timing changes; `PreviewPill`; `editStep`; `untilMs`; `stage.Canvas` wraps the frame in `AnimationPreview`.

Accept when: lanes Pill, Header and Parity pass, driven through the store from the page while the panel does not exist yet; changing a duration replans without re-measuring (count the measuring frames mounted).

### Slice 4. The island and its placement

`AnimatePanel`, `TransportBar`, `HeaderField`, `StepsMenu`, `AnimateToggle`, a read-only strip (segments and ruler scrub, no resize), the stage contract, the mounts in all three layouts and both sizes, command menu entries, shortcut help, and their strings in four locales.

Accept when: lanes Placement, Playback, Scrub, Steps, Persistence and Hotkeys pass in all three layouts at both sizes; screenshots of each layout with the island open go in the PR.

### Slice 5. Strip editing

`StripTimeline` segments as sliders, `createSegmentResize`, `SegmentDetails` with the `NumberField`s, commit on release.

Accept when: lanes Resize and Nudge pass; one save per drag (count PUTs in a signed-in store test or IndexedDB writes in the lane); the frozen axis is measured, not eyeballed (segment positions before release equal the positions at drag start scaled by the frozen total).

### Slice 6. Easing popover

`EasingField`, `EasingCurve`, presets, Custom, the dot, Play transition, Apply to all.

Accept when: lane Easing passes; a custom curve plays in the preview and in the parity script's Takumi frames.

### Slice 7. Sweep

Extend `verify-locale-parity.mjs` to `components/Animation/`, delete unused A3 keys, delete `scripts/parity/live-a3.ts`, update `prototypes/editor-controls/README.md` with an Animate section, record the verification in `docs/plans/animate-new-ui-verification.md`, and add a changeset.

Accept when: lane i18n passes; every lane passes in one run on a fresh Vite (cleared `node_modules/.vite`); a short video of the island in each layout goes in the PR for the operator's review.

## Where A4 plugs in

A4 adds an "Export animation…" entry to the Export menu (`prototypes/editor-controls/shell/ExportControl.tsx`), shown when the animation has two steps or more. Its dialog holds the format and the fps (the only place fps is set). It reads `animation.settings()` as saved, header and per-step transitions included, measures with `measurePreview`, plans with `planTimeline` at the chosen fps, and renders in its worker. The preview and the export then plan the same timeline from the same inputs, so what the panel shows is what the file holds.

## Risks

- `FitFrame` zooms the frame from a transform computed at mount (a known off-centre on phones, also on A1's base). The island changes the stage's height when it opens, so slice 4 checks that the frame refits, and records the phone offset as pre-existing if it shows.
- Dock's `safe` inset grows with the island; a resize loop between the measured island and `FitFrame` would flicker. Measure the island only, with one `ResizeObserver`.
- Re-measuring a long animation on every content change is slow. The split in slice 3 keeps timing edits off that path; content edits only happen in editing mode, where no plan runs.
- #711 is owned by another chat and keeps moving. Merge its tip into this branch at the start of each slice, never rebase, and pin the SHA you merged in the commit message.
