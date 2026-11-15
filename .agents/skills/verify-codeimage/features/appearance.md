# Customize appearance

Choose themes, frame and window styling in the unified editor.

## Sub-features

Theme search/preview/commit; frame background and social target; Card/Editor/Terminal window styles; solid/accent-wash surfaces, border and font controls.

## How to get to it (user POV)

Open `/`. Inspector sections are Theme, Frame, Window, Code and Font. Signature opens from the Frame row.

## Driving it with Playwright

Audit selects Dracula through textbox Search themes and option Dracula Dark theme, checks aria-selected, exports PNG, then checks the Accent wash tile in `[data-control="window.surface"]` (a radio group of rendered previews), asserts the frame's `data-surface="wash"` and exports `wash.png`. Expand sections via `[data-section="themes|frame|window|editor|font"] > button`. Controls use `[data-control="<id>"]` from model.tsx. Theme hover/focus previews; Escape cancels; click/Enter commits. For social sizes open Aspect ratio in Frame and verify output dimensions, not only the displayed label.

Source: `prototypes/editor-controls/theme-styles/ThemePicker.tsx`, `theme-styles/browser.ts`, `model.tsx`.

The surface choice asserts the checked radio. Modern window controls and exact ZIP names are exercised by the tabs journey. Social target dimensions and preview cancellation still need dedicated cases.

## Gotchas

The old Syntax highlight button applies to `/classic`. Window choices affect available controls. Baseline does not cover appearance; audit covers theme commit and surface. Hover cancellation, every window style, fonts and social dimensions remain targeted follow-ups.
