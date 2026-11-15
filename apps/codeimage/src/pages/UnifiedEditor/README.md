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

`shell/preferences.ts` saves `{layout, inspectorSide, themeCards}` in `localStorage` under `codeimage:editor-settings`.
The defaults are Inspector, a panel on the right, and Window theme cards.
There is no migration from the previous storage key.

Settings and the command menu change these choices.
The Experiments section offers the layouts and theme cards.
Appearance contains the colour mode and Inspector panel side.
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

`stage.tsx` supplies the live `Canvas`, `ExportButton`, `exporter`, `ThemePreview`, and frame actions.
Each layout renders `Canvas` once inside a container with a definite size.
A snippet load uses the same frame placeholder as a lazy editor load.
`ReadOnlyNotice` floats at the top of that container, outside the fitted frame.
`EditingControls` hides and makes the existing controls inert while preserving their footprint.
Read-only commands contain only export and settings; editing shortcuts and destructive redaction are disabled.
`FitFrame.tsx` scales the frame to the available space.
`exportRef()` supplies the element that export captures.

## Shared controls and settings

`controls/ControlRow.tsx` renders model controls with `data-control` ids.
`controls/fields.tsx` supplies shared fields.
`ControlOverlay.tsx` opens pickers without changing the frame's rectangle or zoom.
`WindowStyleTiles.tsx` renders window previews.
`ShortcutHelp.tsx` uses the definitions in `controls/shortcuts.ts`.

`shell/Header.tsx` contains the logo, account controls, Share, and Export.
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

`shell/ExportControl.tsx` contains the Export button and its menu.
`shell/export.tsx` shares the image actions with the command menu and keyboard shortcuts.
Every image action passes through `createExporter.request` for the secrets review.
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
node apps/codeimage/src/pages/UnifiedEditor/verify-snippets.mjs http://localhost:4347 /tmp/codeimage-snippet-shots
```

The live scripts set the layout in saved preferences before opening `/`.
They cover all layouts at desktop and phone sizes.
The locale script changes language through Settings and checks visible text and accessible names.
The parity script checks keys, placeholders, empty translations, and hard-coded UI text.
Its negative controls prove that missing keys and hard-coded text fail.
The review script checks secrets review, focus restoration, overlay geometry, row values, and shortcut help.

The snippet script needs the mock API and mock auth enabled, with the installed MSW worker served at `/mockServiceWorker.js`. It creates projects through the dashboard and checks loading, account saves, previews, read-only geometry, Share, export, Clone, missing/failed loads, and route navigation in all six layout/viewport combinations.

Known limitation: for a signed-out viewer with a saved local document, Clone restores that local document instead of keeping the viewed snippet. The shared sync adapter navigates to `/` without handing the clone to the next provider. Resolve this before removing the classic editor. Account Clone works.
