# Customize appearance

Choose themes, frame and window styling in the unified editor.

## Sub-features

Theme search, All/Dark/Light filter, preview and commit; Randomize; frame padding, radius, opacity, background, background image and aspect ratio/social target; seven window styles (macOS, macOS gray, macOS outline, Windows, Card, Editor, Terminal); header, surface (solid/accent wash), tab accent, reflection, watermark, shadow and border (None/Glass/Hairline); font family, weight and ligatures.

## How to get to it (user POV)

Open `/`. Inspector sections are Theme, Frame, Window, Code and Font. Signature opens from the Frame row. Randomize, in the toolbar under the canvas, applies a random theme.

## Driving it with Playwright

Audit selects Dracula through textbox Search themes and option Dracula Dark theme, checks aria-selected, exports PNG, then checks the Accent wash tile in `[data-control="window.surface"]` (a radio group of rendered previews), asserts the frame's `data-surface="wash"` and exports `wash.png`. Expand sections via `[data-section="themes|frame|window|editor|font"] > button`. Controls use `[data-control="<id>"]` from model.tsx. Theme hover/focus previews; Escape cancels; click/Enter commits. Drive the preview with `focus()` rather than hover: the sticky Theme section header can intercept pointer hover over a scrolled option. Window style opens dialog `Window` from `[data-control="window.style"] button`; its radios are the seven styles. For social sizes open Aspect ratio in Frame and verify output dimensions, not only the displayed label.

Source: `pages/UnifiedEditor/theme-styles/ThemePicker.tsx`, `theme-styles/browser.ts`, `model.tsx`.

The surface choice asserts the checked radio. Modern window controls and exact ZIP names are exercised by the tabs journey. Social target dimensions and preview cancellation still need dedicated cases.

## Gotchas

Turning `window.header` off hides the style and tab-accent controls. Baseline does not cover appearance; audit covers theme commit and surface. Hover cancellation, every window style, fonts and social dimensions remain targeted follow-ups.
