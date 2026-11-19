# Animate

Tabs define the animation in tab order. An unmarked tab is one step, a tab with added/removed marks is a before/after pair, and a tab with a script contains several steps with stable IDs. Reordering or removing a tab changes the timeline. Script ranges and timing persist in the project document, through IndexedDB for guests and the project API for signed-in users.

## Controls

Open Animate below the canvas or from Commands. Desktop replaces the canvas actions with playback, time, Cards/List, Copy, Animate and Header. Phones always show List. The canvas badge exposes Done; Escape exits when no timeline selection remains.

Cards show projected code thumbnails grouped by tab. List shows the same groups as an outline. Each group ends with + Step; + New tab ends the timeline. A selected step exposes Hold and, for a script, Enter/Leave/Focus actions for the editor's selected lines. Script badges and dimmed hidden lines appear only during Animate editing. Selecting a phone step opens a bottom sheet.

Transition chips expose Duration, easing presets, a custom curve and Play transition in an anchored popover. Enter and Space open the popover; closing restores chip focus. The toolbar exposes Apply to all. The step menu and right-click menu expose Remove step, Move earlier/later, Add a tab at the end and Remove tab. The overview is a scrollable minimap with linked hover and playback following.

## Current browser cases

Run from the repository root with Node 24:

```sh
fnm exec --using=v24.14.0 env VERIFY_AUDIT=1 VERIFY_CASES=animate-tabs-timeline,animate-script-editing,animate-transition-popover,animate-mode-done,animate-script-reload,animate-phone-timeline,animate-script-export,animate-script-badges VERIFY_PORT=4479 ARTIFACT_DIR=/tmp/animate-timeline-proof node .agents/skills/verify-codeimage/scripts/verify.mjs
```

Use a unique evidence directory and available server/debugging ports for each run. The helper retains launch, doctor, isolated contexts, traces and cleanup. Every scenario uses visible controls and CodeMirror input. It never calls editor stores. Worker instrumentation observes the real export job and does not replace the renderer or encoder.

| Case                         | Assertions                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animate-tabs-timeline`      | Open/reopen on one, two and three tabs; automatic step derivation; desktop transport; Cards/List switching.                                                                                         |
| `animate-script-editing`     | Add script steps; Enter from the editor selection; visible aid; remove a middle step; surviving IDs and selection.                                                                                  |
| `animate-transition-popover` | Enter and Space open the chip editor; Escape closes it and returns focus.                                                                                                                           |
| `animate-mode-done`          | Mode badge, Done, pressed state and keyboard Escape exit.                                                                                                                                           |
| `animate-script-reload`      | Read actual IndexedDB document, reload, and verify stable step IDs and the restored script badge.                                                                                                   |
| `animate-phone-timeline`     | 390×844 List layout; step opens bottom sheet; close and focus return.                                                                                                                               |
| `animate-script-export`      | Export a real GIF with script visibility rules and aids visible in the editor; inspect all submitted scene HTML for aids; decode downloaded frames; retain first/last frame PNGs and scene payload. |
| `animate-script-badges`      | Script badges render in the editor popup host, outside the editor, on their script line and inside the viewport, with line numbers off and on.                                                      |

The older names `animate`, `animate-phone`, `animate-focus`, `animate-geometry` and `animate-followups` select the corresponding current journeys. The retired seeded-step, duplicate-enrollment and draggable full-strip assertions no longer describe the product. Pure timeline geometry tests remain in the app suite.

Evidence includes `audit.json`, per-case screenshots and traces, `animate-script-persisted.json`, `animate-script.gif`, decoded first/last frame PNGs and `animate-script-scenes.json`. Inspect the frame PNGs alongside scene checks; a download alone does not prove fidelity. Fresh-context init scripts skip opaque origins instead of trying to write localStorage there.

## Scope

These cases use the real local app with the existing MSW/Auth0 development boundary. They do not prove production OAuth or PostgreSQL persistence. New cases initially target desktop Sidebar and one phone viewport. Other layouts, locales, touch devices, reduced motion and the full export format matrix need explicit runs before claiming coverage.

MP4/GIF and unequal-step-size cases remain available through `scripts/animation-mp4.mjs`, `animation-gif.mjs` and `animation-step-size.mjs`. See [Export](export.md) for renderer, encoder, compositing and static parity checks. The specialist `scripts/parity/animation-preview.ts` requires the built SSR assets from `packages/render`.

## Source

`components/Animation/timeline/` owns the layouts, minimap, keyboard navigation, menus and popover. `state/editor/animationSettings.ts` derives steps; `core/animation/project.ts` projects tab/diff/script views for preview and export. `components/CustomEditor/plugins/lineMarks/state.ts` maps script ranges and history, and `plugins/scriptLines/` draws edit aids. `core/animation/aids.ts` strips them for export and measurement. The API schemas and parser mirror live in `apps/api/src/modules/project/`.
