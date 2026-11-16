# Animate: the tabs are the timeline

The production plan for the Animate rethink validated on the throwaway prototype `proto/animate-tabs-timeline` (local, head `80e93f87`, worktree `t3-71428a54`). A Codex agent builds it slice by slice on `feat/animate-tabs-timeline`, from `main` at `45f68cd7`. Each slice ends with its acceptance checks green and its own commits. An Opus reviewer reads the branch after the last slice. Nothing merges without the operator's go.

The prototype is reference only. Read it with `git -C <proto worktree> show 80e93f87:<path>`; never merge or cherry-pick it. It holds three variants side by side (`current`, `tabs`, `diff`, `script`), a variant picker pill, localStorage state and untranslated strings. Only the `script` variant ships, rebuilt properly.

## Why

The operator could not use the current panel well:

- Steps are seeded from the tabs only on the first open (`setOpen` in `state/editor/animation.ts`), so sometimes they are there and sometimes they must be added by hand.
- Steps are managed from dropdowns (StepsMenu) that list only the tab name, so two tabs with the same name cannot be told apart.
- Showing a change needs two tabs (a before and an after), even when the change is "these lines appear" or "focus these lines".

## Decisions

Final. They come from the prototype review on 2026-11-16.

1. **The tabs are the timeline.** Steps are derived from the tabs, in tab order, always. There is no separate step list, no seeding and no "Add to animation". Reordering tabs reorders the animation. A → B → A is no longer possible (it was rare; duplicate the tab instead).
2. **A tab can hold several steps (a script).** A tab without a script is one step. A tab with added/removed line marks and no script is two steps: before (without the added lines) and after (without the removed lines). A tab with a script has `n` steps over the same code; each line says from which step it is visible (`enter`), from which step it is gone (`leave`), and in which steps it is focused (`focus`).
3. **A new line inherits its neighbours' range.** A line typed inside a script gets the `enter`/`leave` of the line above it (or below, at the top), not "visible from the current step only".
4. **Script lines leave and enter as whole lines.** Between two steps of the same tab, rows are paired by source line: a line in both steps moves as is (its tokens keep their place in the line), a line only in the first leaves, a line only in the second enters. The generic token matcher runs only between different tabs. This removes the token soup of a block swap.
5. **No empty middle.** In a script transition, leaving lines fade out over 0 → 0.5 and entering lines fade in over 0.4 → 1 (a short overlap, never both at full opacity). Rows still move over the whole transition. Tab-to-tab transitions keep 0.3 / 0.7.
6. **Edit aids never reach an export.** The script badges (`2→`, `●3`) and the dimming of lines hidden in the edited step are CodeMirror decorations shown only while Animate is open, marked with `data-animate-aid`, and stripped by the export clone and by the preview measurement.
7. **UI, as validated on the prototype:**
   - The timeline shows the tabs as groups. Two layouts: **Cards** (filmstrip of code thumbnails) and **List** (outline). A segmented toggle with Tooltip switches them; the choice is a per-viewer preference. A phone always shows List.
   - Inside a tab group, steps are cards; a ghost card "+ Step" at the end of each group adds a step; "+ New tab" ends the row.
   - Transitions are chips between cards (curve glyph + duration). Clicking a chip, or Enter/Space on it, opens a popover anchored on it with Duration, the easing presets, the curve and "Play transition". Closing returns focus to the chip. The toolbar under the timeline no longer edits transitions: for a selected transition it shows the title, a hint and "Apply to all"; for a selected step it shows Hold and the script line actions.
   - The step menu (`•••`, also on right click) has section labels ("Step n", "Tab n · name"), icons, and destructive items in red: Remove step; Move earlier, Move later, Add a tab at the end, Remove tab.
   - The overview strip above the timeline is a minimap: a viewport window shows which cards are visible, hover links strip and cards, and playback keeps the current card centred.
   - On desktop the canvas bar morphs into the transport while Animate is open: [▶ · time · Cards|List · Copy] Animate [Header]. Animate stays the bar's anchor; open, it is a secondary button with a × icon and `aria-pressed`. Play is the only primary button.
   - A pill at the canvas' top left says "● Animate  [Done Esc]" while Animate is open, so the mode and the way out are visible.
   - Motion follows the prototype: the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; popovers and menus grow from their origin (`--kb-popper-content-transform-origin`, scale 0.96, 180 ms in, 120 ms out); the bar morph clips a background layer, it never animates width; nothing animates on keyboard actions; reduced motion keeps opacity only.
8. **Persistence** stays in the project document (API when signed in, IndexedDB when not). Old documents still open.

## Data model

### Script, on the tab

`TabMarks` (app `state/editor/model.ts`, API `TabMarksSchema` in `apps/api/src/modules/project/project.contract.ts`) gains an optional field:

```ts
type TabScript = {
  // Stable step ids, one per step, in order. Length = number of steps (>= 2).
  steps: string[];
  // Lines whose visibility or focus differs between steps. Absent: always
  // visible, never focused by the script.
  lines: {line: number; enter?: number; leave?: number; focus?: number[]}[];
};
type TabMarks = {lines: LineMark[]; focusedLines: number[]; script?: TabScript};
```

`enter`, `leave` and `focus` are 1-based step numbers. `enter` 1 is the same as absent. A line with `leave = k` is visible in steps `< k`. The API must name every new field in TypeBox (fast-json-stringify drops unnamed ones) and the parser mirror (`project.model.ts`) must accept and validate it: integers, `1 <= enter < leave <= steps.length`, `focus` values in range, unique lines.

Script lines live in the line-marks state field (`components/CustomEditor/plugins/lineMarks/state.ts`) so they map through edits exactly like the other marks, and are saved with them.

### Steps

`AnimationStepSettings` gains how the step projects its tab:

```ts
type StepView =
  | {kind: 'tab'}
  | {kind: 'diff'; side: 'before' | 'after'}
  | {kind: 'script'; step: number};
type AnimationStepSettings = {
  id: string;
  editorId: string;
  view?: StepView; // absent = {kind: 'tab'}
  holdMs: number;
  transition?: {ms: number; easing: EasingValue};
};
```

Step ids: a tab step uses the editor id, a diff step `${editorId}:before|after`, a script step the id in `script.steps`. `settings.steps` is recomputed from the tabs whenever tabs, marks or scripts change; timing (`holdMs`, `transition`) is kept by step id, and a new step gets the defaults. The saved `steps` therefore always match the tabs, so the web export and the API need no derivation of their own.

`projectStep(tab, view)` moves to `core/animation/project.ts` (pure, shared by preview, web export and tests). Script projection keeps the highlight marks, drops +/−, and sets `focusedLines` from the script. It also returns, per row, the source line number, which the engine uses (decision 4).

### Migration

A saved document whose `steps` do not match the derived ones (old seeded lists, reordered steps, A → B → A) is replaced by the derived list on load, keeping timing for every id that still exists. The tab order is not changed. This loses custom step orders; the operator accepted it.

## Engine

- `Step` (`core/animation/model.ts`) gains `rows?: number[]` (source line per row) and `source?: string` (editor id).
- `pairSteps` (`core/animation/pair.ts`): when both steps share `source` and carry `rows`, pair by row identity: rows in both steps pair their tokens within the line (magic-move keyed per line, or by index when the text is equal); rows only in `from` leave; rows only in `to` enter. Otherwise the current matcher.
- `compileScene` (`core/animation/compile.ts`) takes the leave/enter windows from the scene: `{leaveEnd: 0.5, enterStart: 0.4}` for a same-source scene, `0.3 / 0.7` otherwise. `activeRanges` follows.
- Unit tests for both, and the existing Takumi parity checks (`scripts/parity/animation-preview.ts`) still pass.

## UI

Rebuild the prototype's `script` variant on the real store. From the prototype, under `apps/codeimage/src/components/Animation/`: `timeline/` (Filmstrip, Outline, LayoutToggle, layout, model, minimap, StepToolbar, TransitionPopover, LineActions, actions, motion, keys, styles), `TransportBar.tsx` (`BarTransport`), `BarMorph.ts`, `AnimateToggle.tsx`, `AnimateModeBadge.tsx`, `EasingField.tsx` (anchor mode), `scriptActions.ts`, and `pages/UnifiedEditor/controls/CanvasToolbar.tsx`.

Remove: the variant picker (`ProtoAnimatePicker`), the `current` timeline (`StepsMenu`, `SegmentDetails`, the full `StripTimeline` mode, `PhoneSteps` if List covers the phone), seeding on first open, and the localStorage script store. Keep the per-viewer layout preference in localStorage.

All strings go through i18n in the four locales (en, it, de, es). Styles in vanilla-extract with `@codeimage/ui` tokens; kit components (SegmentedField, Tooltip, IconButton, DropdownMenu, Popover).

## Slices

Each slice: typecheck (`pnpm libs:build` first), `vitest run` in `apps/codeimage`, API unit tests when the API is touched, oxfmt on touched files, oxlint clean, no new code comments.

1. **Model, schema, projection.** `TabScript` in app and API types, TypeBox, parser mirror, `StepView`, `core/animation/project.ts`, derivation of `settings.steps` from tabs with timing kept by id, migration on load, removal of seeding. Tests: parser accepts/rejects, derivation keeps timing on reorder/insert/remove, projection of tab/diff/script.
2. **Engine.** Row-aware pairing and per-scene leave/enter windows. Tests in `pair.test.ts` and `compile.test.ts` (block swap: no token pairs across swapped lines; in-line change: no frame where the line is empty). Parity script green.
3. **Script editing.** Script lines in the line-marks field (map through edits, saved with marks, decision 3 inheritance), script actions (add/remove step with stable ids, line enter/leave/focus from the selection), edit aids as decorations with `data-animate-aid`, stripped in `cloneExportNode`/`cloneAnimationNode` and in the measurement.
4. **Timeline and bar.** Everything in decision 7, i18n, removal of the old UI. Phone: List layout and the bottom-sheet details where the prototype used them.
5. **Verification.** New audit cases in the `verify-codeimage` skill (not `verify-*.mjs` in source folders): open Animate on 1/2/3 tabs, add a script step, remove a middle step (selection follows the id), chip popover opens and returns focus, Done leaves Animate, export a script animation and check no aid is in the frames, reload keeps scripts. Record results in `docs/plans/animate-tabs-timeline-verification.md`.

## Deviations

- Slice 2: the retained Takumi parity runner cannot execute on this main baseline because `packages/render/dist/index.mjs` and the render package are absent. The direct Node 24 invocation reaches that missing module; the tsx invocation additionally fails on top-level await in CommonJS. Engine behavior is covered by the app unit suite; Takumi parity remains unverified.
