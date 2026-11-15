# Unified editor

This folder contains the editor page, its shared controls, and the Inspector, Dock, and Studio layouts.

The route table in `apps/codeimage/src/index.tsx` selects the page.

| Route         | Page                                                                |
| ------------- | ------------------------------------------------------------------- |
| `/`           | Unified editor for signed-out users. Dashboard for signed-in users. |
| `/classic`    | Classic editor.                                                     |
| `/:snippetId` | Unified editor for a saved snippet.                                 |

`/dashboard` redirects to `/`. `/login` keeps the existing sign-in flow.
The unified editor and the classic editor use the same stores and local document.

## Preferences

`shell/preferences.ts` saves `{layout, inspectorSide, themeCards, exportStyle}` in `localStorage` under `codeimage:editor-settings`.
The defaults are Inspector, a panel on the right, Window theme cards, and the Menu export style.
There is no migration from the previous storage key.

Settings and the command menu change these choices.
The Experiments section offers the layouts and theme cards.
Appearance contains the colour mode, the Inspector panel side, and the export style.
The `v` and `t` URL parameters have no effect.
Changing a preference leaves the URL unchanged.

## Page and layouts

`index.tsx` exports the page from `harness.tsx`.
`EditorHost.tsx` loads the editor stores and local document before the page mounts.
The page creates one model and a new stage whenever the layout changes.
`page-state.ts` maps the route id and sync adapter into `EditorPageState`: local, loading, owner, read-only, or unavailable.
The shared sync provider reacts when the route id changes and redirects failed or missing snippets to `/404`.
It mounts the header, command menu, settings dialog, and What's new host once.

`registry.ts` maps layout ids to `variants/<layout>/index.tsx`.
Each layout exports `meta` and a default component with `VariantProps`.
The props contain `model`, `stage`, `pageState`, and `ThemePicker`.

The page root has class `unified-editor` and a `data-layout` attribute.
Inspector also sets `data-inspector-side` on the page and layout roots.
Phones keep the Inspector panel in a bottom sheet on either side setting.

The header sits above the layout.
`header.css.ts` defines an 8px inset, a 36px row, and an 8px gap.
The row is 40px tall below 769px.
Layouts fill the remaining space with `flex: 1` and `min-height: 0`.
Their roots stay in normal flow so the body can contain portaled popovers.

## Model and stage

`model.tsx` exposes sections, controls, themes, and preview actions through `createEditorControlsModel()`.
`contract.ts` defines the layout props.

Controls have stable ids, translated labels, visibility, and typed values.
Their kinds are toggle, segmented, select, range, number, background, and custom.
Custom controls use the existing image, window style, and font pickers.

`preview.ts` keeps one preview session.
The first preview saves the applied state.
Each later preview restores that state before showing another value.
`endPreview()` restores the applied state.
A control's `set()` or a theme's `apply()` ends the preview and saves the choice.
Previews do not save or send analytics.

`syntax.ts` reads token colours from CodeMirror extensions with `highlightingFor()` and the theme's style modules.
Tokens without a colour use the base text colour.

`stage.tsx` supplies the live `Canvas`, `ExportButton`, `exporter`, `ThemePreview`, format and randomize.
Each layout renders `Canvas` once inside a container with a definite size.
A snippet load uses the same frame placeholder as a lazy editor load.
`ReadOnlyNotice` floats at the top of that container, outside the fitted frame.
`EditingControls` hides and makes controls inert while loading, preserving the owner's layout.
Read-only pages remove those controls and their containers so the canvas can take the space.
Export waits for a snippet to load, so it cannot capture the previous document.
Read-only commands contain only export and settings; editing shortcuts and destructive redaction are disabled.
`FitFrame.tsx` scales the frame to the available space.
`exportRef()` supplies the element that export captures.

## Shared controls and settings

`controls/ControlRow.tsx` renders model controls with `data-control` ids.
`controls/fields.tsx` supplies shared fields.
`ControlOverlay.tsx` opens pickers without changing the frame's rectangle or zoom.
`WindowStyleTiles.tsx` renders window previews.
`ShortcutHelp.tsx` uses the definitions in `controls/shortcuts.ts`, including the `?` opening key.
The shared stage places its labelled desktop trigger at the top left of the canvas, outside the export frame.
It opens an anchored overlay without a backdrop and leaves the frame rectangle and zoom unchanged.
A resize observer hides the trigger if it would overlap the frame or extend beyond the canvas.
The keyboard shortcut and command-menu entry still open help when the trigger is hidden.
Phones keep their existing help trigger, placement, and dialog.

`CanvasToolbar.tsx` contains Format code, Copy image and, with the Local AI experiment, Ask AI on desktop in all three layouts. Ask AI turns the toolbar into the Local AI bar.
Shortcut help has its own trigger. Randomize stays in the command menu and its shortcut, without a button.

`shell/Header.tsx` contains the logo, account controls, Share, and Export.
`shell/header-actions.ts` lets mounted layout entries claim Commands, Settings, or Experiments.
The header renders only unclaimed actions, and cleanup returns ownership when an entry unmounts.
Inspector keeps Commands before Experiments and Settings in the header.
Dock claims Commands and Settings; Studio claims all three in its desktop rail.
Studio groups Commands, Settings, Experiments, and GitHub at the bottom, retaining `CommandMenuButton` and its announcement dot.
Phones claim no header actions and keep the existing header.

`shell/SettingsDialog.tsx` stays mounted while layouts change.
`shell/sections.tsx` defines the sections, groups, and rows.
Search reads those same rows.
About contains the repository, Bugs and feedback, Releases, and Better Comments for GitHub links.
`shell/links.ts` shares their destinations with the existing external-link commands and Studio's repository button.
Better Comments retains its Umami event. Dock and Studio have no footer.
`shell/settings-state.ts` controls the open section and restores focus when the dialog closes.
Dialogs opened by a settings row live in `SettingsDialog`, so closing the row's panel cannot dispose them.

The adapters in `localized/` reuse existing stores, actions, and styles with translated labels.
Every editor label, hint, tooltip, and accessible name uses `useI18n<AppLocaleEntries>()`.
Editor translations live in `src/i18n/editor.ts` and merge into all four shipped locales.

## Theme cards

`theme-styles/ThemePicker.tsx` provides search, dark and light filters, and the selected card style.
`window/`, `orb/`, and `aa-list/` draw the styles.
`style.ts` keeps the chosen style in a signal.
Preferences load and save that choice.

`browser.ts` handles theme previews and keyboard navigation.
Hover or keyboard focus previews a theme.
Leaving the list or pressing Escape restores the applied theme.
Click, Enter, or Space applies the choice.
Arrow keys follow the visible list or grid.

`ThemeSwatch.tsx` draws a compact theme mark.
Its default variant follows the selected card style.
Layouts render `props.ThemePicker` so the same preference reaches every picker.

## Commands and export

`command-menu/CommandMenu.tsx` binds Cmd+K on Apple platforms and Ctrl+K elsewhere.
It lists themes, control choices, frame actions, exports, and settings.
`listed-model.ts` adapts custom window and font pickers into command choices.
The highlighted command previews its value.
Enter applies it, and closing the menu ends the preview.
Layouts use `CommandMenuButton` for their own trigger.

`shell/export-formats.ts` lists the formats in display order, with their icon, description and abilities, and defines `ExportChoice`, a format, scale and JPEG quality for one export.
`shell/export-actions.tsx` lists every export action with its icon, title, one-line description, visibility and disabled state. Every Export surface renders its rows from it.
`shell/export.tsx` shares the image actions with the command menu and keyboard shortcuts.
An image action takes an optional `ExportChoice`; without one it uses the saved export settings.
Every image action passes through `createExporter.request` for the secrets review, which keeps the choice it was asked with.
`shell/ExportControl.tsx` binds the shortcuts, owns the secrets review and renders the chosen Export style.

The Appearance setting "Export style" chooses how Export offers a one-off format and scale, saved as `exportStyle` in the editor preferences.
Menu (`shell/export-styles/panel.tsx`, the default) keeps the split button and opens a panel under its arrow. Dialog (`shell/export-styles/sheet.tsx`) opens a dialog with a preview.
Both start from the saved settings each time and can save the choice as the default.
Every action button carries `data-export-action` with its id.
Export settings use `getExportCanvasStore()`.
The per-tab export renders a separate preview frame for each tab.

The signature controls edit the same frame signature that the classic editor and exports draw.
Saved signatures use `state/signatures/`.
Each snippet keeps its own signature copy, so later edits to a saved signature leave the snippet unchanged.

## What's new

`components/WhatsNew/WhatsNewHost` owns announcements.
`places.ts` checks registry locations against model controls, settings rows, and Export items.
Shared controls render the dots and bind reveal actions.
Layouts do not import What's new modules. The root oxlint override enforces that boundary.

The shell offers a permanent Experiments button that opens Settings on that section.
Studio hosts it beside Settings in the desktop rail; Inspector and Dock keep it in the header.
Its labelled, secondary ghost What's new button is available for `NEW_FOR_DAYS` (45 days)
from the newest release's date, only while neither Nudge nor Showcase is on screen.
It reopens the newest release expanded for this session, without resetting stored facts.
Keyboard dismissal focuses the header entry when visible; keyboard reopening focuses the Nudge.
Pointer dismissal restores nearby non-text-field focus and, after the Nudge's exit, fades and
scales the header entry from 0.96. Reopening fades it out as the Nudge enters.
The entry is first in the right-aligned action row, retaining its width through its exit and
reserving nothing afterwards, so the later header actions keep their positions throughout.
Page-load entries and keyboard handovers are instant; reduced motion uses opacity only.
Reloading respects the stored dismissal. A still unread dot on the sparkle icon appears with
unseen highlights, outside the three feature-dot slots.
Both extra buttons hide at widths of 768px and below; the mobile header stays unchanged.
After expiry, the Settings archive remains available.

`components/WhatsNew/motion.ts` defines curves, durations, and stagger delays for announcements.
The announcement styles and exit timers read those constants.
Keyboard actions do not animate.
Reduced motion uses opacity without delays and shows illustrations in their final state.

## Verification

From the repository root, with the dev server running on port 4347:

```sh
node apps/codeimage/src/pages/UnifiedEditor/verify-locale-parity.mjs
node apps/codeimage/src/pages/UnifiedEditor/verify-i18n.mjs http://localhost:4347 /tmp/codeimage-i18n-shots
node apps/codeimage/src/pages/UnifiedEditor/verify-review.mjs http://localhost:4347 /tmp/codeimage-review-shots
```

The live scripts set the layout in saved preferences before opening `/`.
They cover all layouts at desktop and phone sizes.
The locale script changes language through Settings and checks visible text and accessible names.
The parity script checks keys, placeholders, empty translations, and hard-coded UI text.
Its negative controls prove that missing keys and hard-coded text fail.
The review script checks secrets review, focus restoration, overlay geometry, row values, and shortcut help.

Snippet verification lives in `.agents/skills/verify-codeimage/scripts/snippets.mjs`, registered as six `snippet-*` cases in the skill audit. Run them through `VERIFY_AUDIT=1 VERIFY_CASES=snippet-save,snippet-previews,snippet-read-only,snippet-clone,snippet-missing,snippet-navigation node .agents/skills/verify-codeimage/scripts/verify.mjs`. The helper owns Vite, the installed MSW worker, mock sign-in and disposable contexts. Case coverage is documented in the skill's `features/projects.md`.

Known limitation: for a signed-out viewer with a saved local document, Clone restores that local document instead of keeping the viewed snippet. The shared sync adapter navigates to `/` without handing the clone to the next provider. Resolve this before removing the classic editor. Account Clone works.
