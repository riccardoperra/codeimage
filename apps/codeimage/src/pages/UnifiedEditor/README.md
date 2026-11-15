# Unified editor

This folder contains the editor page, its shared controls, and the Inspector, Dock, and Studio layouts.

The route table in `apps/codeimage/src/index.tsx` selects the page.

| Route         | Page                                                                |
| ------------- | ------------------------------------------------------------------- |
| `/`           | Unified editor for signed-out users. Dashboard for signed-in users. |
| `/classic`    | Classic editor.                                                     |
| `/:snippetId` | Classic editor for a saved snippet.                                 |

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
It mounts the header, command menu, settings dialog, and What's new host once.

`registry.ts` maps layout ids to `variants/<layout>/index.tsx`.
Each layout exports `meta` and a default component with `VariantProps`.
The props contain `model`, `stage`, and `ThemePicker`.

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
`FitFrame.tsx` scales the frame to the available space.
`exportRef()` supplies the element that export captures.

## Shared controls and settings

`controls/ControlRow.tsx` renders model controls with `data-control` ids.
`controls/fields.tsx` supplies shared fields.
`ControlOverlay.tsx` opens pickers without changing the frame's rectangle or zoom.
`WindowStyleTiles.tsx` renders window previews.
`ShortcutHelp.tsx` uses the definitions in `controls/shortcuts.ts`.
`CanvasToolbar.tsx` is the one island under the canvas in every layout: Format code, Copy image, and the shortcut help where the layout has no other place for it.
Randomize has no button. It stays in the command menu and its shortcut.

`shell/Header.tsx` contains the logo, account controls, Share, and Export.
In Inspector on a wide window it also has the command menu's Search button, left of the settings button.
The settings trigger moves into Dock or Studio when that layout has room for it.
`claimSettingsEntry()` keeps exactly one trigger visible.

`shell/SettingsDialog.tsx` stays mounted while layouts change.
`shell/sections.tsx` defines the sections, groups, and rows.
Search reads those same rows.
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
