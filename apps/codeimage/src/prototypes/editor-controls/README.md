# Editor controls prototype

This folder holds the editor in three layouts and several ways to draw a theme. The user picks a layout and a theme card style in the settings, as in a real app. No prototype chrome sits on the page. It follows the `prototype` skill from [emilkowalski/skills](https://github.com/emilkowalski/skills). A second route, `../theme-card/`, shows the theme pickers alone next to the canvas. Nothing in production imports from `prototypes/`. The only production change is the route table in `apps/codeimage/src/index.tsx`.

## Run it

1. Start the app as usual, for example `pnpm exec vite --port 4321 --strictPort` from `apps/codeimage`.
2. Open `http://localhost:4321/`.

| Route                         | What it shows                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `/`                           | The unified editor for a signed-out user. A signed-in user gets the dashboard, as before. |
| `/prototypes/editor-controls` | The unified editor, also for a signed-in user.                                            |
| `/classic`                    | Today's production editor, for comparison.                                                |
| `/prototypes/theme-card`      | The theme pickers alone, with the one pill that is left.                                  |

The snippet route `/:snippetId`, `/dashboard` and `/login` are untouched and still open the production screens.

The layout, the side of the Inspector panel and the theme card style are settings. Change them in the settings dialog or in the command menu. Each layout opens the settings from its own chrome: Inspector from the gear in the header, Studio from the foot of its rail under Search, Dock from the gear in its floating bar. On a phone, where the rail and the bar have no room for it, the gear is in the header in every layout. Two URL parameters pick a layout and a style for a link, with no visible control:

| Parameter | Values                                    | Wins over the stored choice |
| --------- | ----------------------------------------- | --------------------------- |
| `v`       | `2` Inspector, `3` Dock, `4` Studio       | yes                         |
| `t`       | a theme style id, such as `window`, `orb` | yes                         |

A link that carries a parameter keeps it up to date when the setting changes. A link without it stays clean. `v=1`, which was Current, falls back to the stored layout.

The prototype uses the same stores as today's editor. Changes you apply here are saved to the same local document that `/classic` opens. A preview is never saved.

## The model

`model.tsx` turns every option of today's sidebar into data. `createEditorControlsModel()` returns:

```ts
type Control = {id: ControlId; label(): string; visible(): boolean} & ( // id is 'frame.padding', ...
	| {kind: 'toggle'; value(): boolean; set(value: boolean): void; preview(value: boolean): void}
	| {kind: 'segmented' | 'select'; options(): {key: string; label: string}[]; value(): string; set(key: string): void; preview(key: string): void; disabled(): boolean}
	| {kind: 'range'; value(): number; set(value: number): void; preview(value: number): void; min: number; max: number; step: number}
	| {kind: 'number'; value(): number; set(value: number): void; min: number; max: number}
	| {kind: 'background'; value(): string; set(value: string): void; colors: string[]; gradients: string[]}
	| {kind: 'custom'; Control: Component}); // the production control, already bound to the store
model.sections: {id: 'frame' | 'window' | 'editor' | 'font'; label(): string; controls: Control[]}[];
model.control(id: ControlId): Control | undefined;
model.themes(): {id; name; dark; colors: {background; window; text; syntax}; active(): boolean; apply(): void; preview(): void}[];
model.preview(write: () => void): void;
model.endPreview(): void;
```

`visible()` is false where today's sidebar hides a row, for example opacity while the frame is hidden. A choice control's `value()` is the key of the selected option. Three options are `custom` because they need the production picker: `frame.backgroundImage` (image upload), `window.style` (window previews), and `font.family` (web and system fonts).

`colors.syntax` holds the colour the code editor gives each token in that theme: `base`, `keyword`, `string`, `function`, `number`, `comment`, `type`, and `property`. `syntax.ts` reads them back from the theme's CodeMirror extensions through public API: `highlightingFor()` gives the classes for a tag, and the theme's style modules give the colour of those classes. A token that the theme does not colour gets `base`, which is how the editor draws it.

A preview shows a value on the canvas without saving it and without sending analytics. `preview.ts` keeps one session: the first preview remembers what the canvas showed, and every later preview, of a theme or a control, first puts that back. `endPreview()` ends the session. Every `set()` and `apply()` ends it too, then saves the value. `active()` stays on the applied theme while another one is previewed. `model.preview(write)` previews any write to the stores, for a control that a layout builds itself.

## The variant contract

Each layout is a folder, `variants/<slug>/index.tsx`, that exports two things:

- `meta`, a `VariantMeta` with the `name` of the layout and the `axis` it explores.
- A default export, a `Component<VariantProps>` that lays out the editor screen under the page's header.

`VariantProps` has the `model`, a `stage`, and a `ThemePicker`.

The stage, from `stage.tsx`, holds the parts of the real editor that a layout places:

- `Canvas` renders the live frame with the CodeMirror editor. It fills its parent and zooms the frame out when the frame is larger than the space it gets, so give it a parent with a definite size. Render it exactly once.
- `ExportButton` is the Export control (see [Export](#export)), and `CopyToClipboardButton` the production button, both bound to the canvas. `exporter` runs the exports for anything else, such as the command menu.
- `randomize()`, `format()`, and `canFormat()` are the frame toolbar actions. `controls/FrameActions` draws today's frame toolbar without its export settings button.
- `ThemePreview` draws the mini editor of today's theme cards for one entry of `model.themes()`.
- `exportRef()` is the element that export captures. Pass it to any other production component that takes a `canvasRef` or a `frameRef`, such as `FrameToolbar`.

`ThemePicker` is the theme picker in the card style chosen in the settings: search, the dark and light filter, and every theme. Place it where your layout shows themes, in a container with a definite height, and it fills it. Its optional props are `size` (`'md'` for the kit fields on touch layouts), `autofocus` (focus the selected theme on mount, for a tray or a sheet) and `onPick(theme, byKeyboard)`.

`ThemeSwatch`, from `ThemeSwatch.tsx`, draws one theme as a small mark, for example in a button that shows the applied theme. Without a `variant` it draws the mark of the chosen style. The marks are `syntax-orb`, `aa`, and `window`. `window` also takes a `width`, in px or `fill`. With `fill`, `window` keeps the default frame's shape, about 5 to 4, and grows with its card.

`harness.tsx` exports `UnifiedEditor`, the page behind `/` and `/prototypes/editor-controls`. It renders the chosen layout, the command menu and the settings dialog. It creates a new stage for each mount of a layout and keeps one model for the whole session. `registry.ts` maps each layout id to its folder and reads `meta` from it. Today's editor is no longer a layout: it is the production route `/classic`. `ModelDump.tsx`, a plain list of every control with native inputs, is no longer used by a layout and can start a new one.

## The shell

`shell/` holds what every layout shares around the canvas: the header and the settings.

- `Header.tsx` is the compact header. It has no bar of its own and is as tall as its controls, so it reads as the first row of the islands. It holds the logo, the dashboard link and the snippet name where production shows them, the gear that opens the settings while the layout has no entry of its own, the production Share, the Export control, and the production sign-in or user badge. The harness renders it once, above the layout, so no layout mounts it.
- `SettingsDialog.tsx` is the one settings surface, a kit `Dialog` in two panes. The harness mounts it once.
- `sections.tsx` holds every setting as data: sections, groups and rows. The dialog draws them and its search reads the same rows.
- `settings-state.ts` exports `settings.open(section?)`, `settings.close`, `settings.isOpen` and `settings.section`. Closing returns focus to what opened it, or to the settings entry on screen when a layout change replaced it. A layout that shows its own entry calls `claimSettingsEntry()` while it is on screen, and the header drops its gear then.
- `preferences.ts` keeps the three choices in local storage under the one key `codeimage:prototype-settings`, as `{layout, inspectorSide, themeCards}`. Without stored choices the editor opens in Inspector with the panel on the right and Window cards. `preferences.restoreDefaults()` turns every experiment off.
- `commands.ts` lists the same choices as commands for the command menu, and one `Settings: <section>` command per section.
- `previews.tsx` draws the small layout wireframes, and `icons.tsx` the icons of the header and the settings.

### The header and the islands

The harness renders the header above the layout, so it sits at the same place in every layout. `header.css.ts` holds the only numbers behind where it sits:

| Number | Value                  | Meaning                                                                 |
| ------ | ---------------------- | ----------------------------------------------------------------------- |
| inset  | 8px                    | The space between the page's edge and the row, on the top and the sides |
| row    | 36px, 40px under 769px | The height of the row, which is the height of its controls              |
| gap    | 8px                    | The space under the row, above the first islands                        |

The header is 52px tall in all, 56px on a phone. A layout fills the rest of the page (`flex: 1; min-height: 0`, not `100dvh`), keeps its first islands 8px from the sides so that the header's edges meet theirs, and adds no space at its top. Dock's canvas runs edge to edge on a phone, which is the one place where the edges do not meet.

The logo is 28px tall, which is the height of its mark. Beside 36px buttons that leaves 4px above and below it. At 22px it left 7px, and the left of the row read lighter than the right.

### The settings dialog

The left pane has a search field and the sections, each with an icon. The right pane has a breadcrumb, `Settings / General`, a close button, and the section as titled groups. A group is one island of rows. A row is a title, one line that explains it, and its control on the right. A `wide` row puts its control under the text at the island's width, which the cards with a preview use.

| Section     | Group        | Row                 | Control                             |
| ----------- | ------------ | ------------------- | ----------------------------------- |
| General     | Interface    | Language            | Segmented, one option per locale    |
| Appearance  | Colours      | Colour mode         | Segmented: Dark, Light, System      |
| Appearance  | Inspector    | Panel side          | Segmented: Left, Right              |
| Export      | Image        | Format              | Segmented: PNG, SVG, JPEG           |
| Export      | Image        | Quality             | Slider, 70 to 100%, only for JPEG   |
| Export      | Image        | Scale               | Segmented: 1x, 2x, 3x, 6x           |
| Export      | Tabs         | Only the active tab | Switch                              |
| Experiments | Editor       | Layout              | Cards: Inspector, Dock, Studio      |
| Experiments | Theme picker | Theme cards         | Cards: Window, Orb, Aa list         |
| What's new  | Release      | Highlights          | New tags and Show me actions        |
| About       | CodeImage    | Version             | The version, to read                |
| About       | CodeImage    | GitHub              | A link to the repository            |
| About       | Account      | Log out             | A button, only for a signed-in user |

- Export reads and writes the production export store, `getExportCanvasStore()`, the one store that today's export settings popover writes. Today's export dialog keeps its own format, quality and scale; here there is one value of each.
- Experiments holds what is not the default yet. Inspector and Window carry a `Default` tag, and `Restore defaults` goes back to both. The choices are cards and not switches because each is one out of three: two switches would turn each other off.
- The search filters the rows of every section by title and description, and every word has to match. The results are grouped by section. Escape clears the search, a second Escape closes the dialog, and `/` focuses the field.
- Opening the dialog focuses the section on screen, not the search, so a phone does not open its keyboard over the settings.
- Under 769px the left pane becomes two rows on top: the search with the close button, then the sections as tabs without icons. Five sections do not need a screen of their own, and this keeps every section and the search one tap away.
- To add a setting, add a row to a group in `sections.tsx`. Use the segmented control or a switch for a choice. The kit's `Select` does not work in this dialog: the dialog is modal, and Kobalte marks the select's list, which it adds outside the dialog, as hidden from assistive technology.
- Create any dialog a row opens in `SettingsDialog`, which stays mounted. The panel inside it goes away as the dialog closes.

The harness sets `data-layout` on the page root, `.proto-variant`. While Inspector is chosen it also sets `data-inspector-side="left|right"`, on `.proto-variant` and on the root element that the layout renders, so a layout can read it from either.

The old menu at the top left of the header is gone. Its entries moved:

| Old entry  | New home                                                         |
| ---------- | ---------------------------------------------------------------- |
| Settings   | The gear in the header, and the `Settings…` command              |
| What's new | Settings, What's new, and the `What's new` command               |
| GitHub     | Settings, About, and the `CodeImage on GitHub` command           |
| Logout     | The user badge's menu, Settings, About, and the `Logout` command |

## Export

`shell/ExportControl.tsx` is Export in two parts. The button exports the image at once with the export settings, with no dialog, and Ctrl+S does the same. The arrow beside it opens a menu: `Export image` with what it gives, such as `PNG at 3x`; `Export one image per tab`, a zip with one image per tab, which stays listed with `Needs two tabs or more` while the snippet has one tab; `Redact secrets` while a tab shows a secret; and `Export settings…`, which opens Settings at Export.

`shell/export.tsx` runs them. The image is production's `exportImage` with the format, scale and quality of the export store. One image per tab runs what production's `useExportSnippet` runs when its stored `oneImagePerTab` flag is on, on demand: a `PreviewFrame` per tab, `renderTabFiles` and `deliverTabFiles`. The stored flag itself is not used here, since the menu offers both exports.

## Shared controls

`controls/` holds the controls the three layouts share, so a row looks and behaves the same everywhere:

- `ControlRow` renders one control of the model as a row of today's sidebar. It maps every kind to a field, turns the two on/off choices (alternative background, glass border) into switches, draws the window style as tiles, and wraps the row in an element with `data-control`. A layout passes the `prefix` of its field ids and places the rows; the background stays with the layout.
- `fields.tsx` has the parts: `SwitchField` (Kobalte's switch with the kit tokens), `SegmentedChoice`, `SelectChoice`, and `AspectRatioField` (the production picker).
- `WindowStyleTiles` shows every window style with its preview.

## Inspector's panel side

Inspector puts its panel on the right. Set `data-inspector-side="left"` on its root, `.inspector-root`, or on any element around it, and the panel moves before the canvas; `right` or no attribute keeps it on the right. Phones keep the bottom sheet either way. The pickers that open over the panel follow it to either side.

## Theme styles

`theme-styles/` holds the three ways to draw a theme, as bodies that every layout and the theme-card route render:

- `style.ts` lists the styles and keeps the chosen one in a signal mirrored to `t`.
- `ThemePicker.tsx` is the body: search, filter, and the list of the chosen style. The columns follow the width of the container.
- `browser.ts` holds the behaviour every style shares. Hover or keyboard focus previews a theme on the canvas, and leaving the list or pressing Escape puts the applied theme back. A click, Enter or Space applies it. The arrow keys move through the options as they sit on screen, in a list or in a grid.
- `window/`, `orb/`, and `aa-list/` draw the list of each style.

`../theme-card/` renders the same bodies with a fixed style, each in an island beside the canvas at the width of a real panel. It cannot drift from the layouts.

## Command menu

`command-menu/` holds one command menu for every layout. The harness mounts it and binds Cmd+K, or Ctrl+K off Apple platforms. No layout has to do anything to get it.

- It lists every theme, every option of every visible control, every background fill, the actions Randomize and Format, the exports and every export setting (`Export image`, `Export one image per tab` while there are two tabs or more, each format, scale, JPEG quality and tab choice), and the settings: `Settings…`, one `Settings: <section>` command per section of the dialog, each layout, the Inspector side, each theme card style, the colour mode, and what the old header menu held. `listed-model.ts` turns the window style and the font, which the model hands out as production pickers, into plain choices over the same stores, so that they can be listed too.
- The highlighted row is previewed on the canvas through the model's preview session. Enter saves it. Escape, or any other way out, ends the preview.
- It floats at the bottom centre with no scrim and is six rows tall, so the frame stays in view while the list is walked.
- It does not open over an open list, menu, popover or modal dialog. A layout that wants it to open anyway closes what it has open first: `commandMenu.beforeOpen(close)`.
- A layout adds a button with `commandMenu.open` and shows `commandMenu.shortcut` beside it, as Dock and Studio do. Both come from `command-menu/state.ts`.
- `commandMenu.setReveal(id => ...)` lets a layout answer a command for a control that has no values to list, such as the image upload, by showing where the control lives. Without it the menu leaves those commands out.

## Rules for builders

- Edit only your own `variants/<slug>/` folder. Set your `axis` in your `meta`.
- Style with the tokens from `@codeimage/ui` (`themeVars`) in vanilla-extract `.css.ts` files inside your folder. Plain CSS is fine if every selector starts with a class that belongs to your folder.
- Add no dependency without saying so in your report.
- Show themes with `props.ThemePicker`, not with a grid of your own, so that the Theme cards setting reaches your layout.
- Do not render a header: the harness renders `shell/Header` above your layout. Size your root with `flex: 1; min-height: 0`, start your islands at its top edge, and keep them 8px from the sides.
- The page root stays in normal flow. A fixed root lets the body collapse, and the body then clips the kit popovers portaled to it.
- Render rows with `controls/ControlRow`, not with fields of your own.
- `SegmentedField` with `adapt` makes the kit control `height: 100%`. Under a parent of auto height that falls back to its line height, about 24px. Give the parent the kit's field height, 36px at `sm` or 40px at `md`.
- Solid delegates `onKeyDown` to `document`, so `stopPropagation()` in an `onKeyDown` handler does not keep a key from another listener on `document`, such as the command menu's shortcut. Use a native `on:keydown` listener where propagation matters.

## What's new

The harness mounts `components/WhatsNew/WhatsNewHost` once. Its Nudge floats at the bottom left and waits for Settings, the command menu, and other popups to close before appearing. A release with `major: true` uses the Showcase sheet instead. Neither announcement reserves layout space.

The registry and store live in `state/whats-new`. Import that folder's `index.ts` from other folders. The harness binds `command-menu` to `commandMenu.open` and `settings-experiments` to `settings.open('experiments')`. `shell/ExportControl` binds `export` to its arrow's menu, which lists Export one image per tab and, while the code holds a possible secret, Redact secrets. In `/classic`, the production `ExportButton` binds it to its dialog. A layout puts `NewDot` beside each command-menu button it renders. Settings owns the dots on the Layout and Theme cards rows, and the archive before About. The Export control owns the One image per tab dot, on its arrow, and the Hide secrets dot, on its button while the code holds a possible secret. A dot inside the menu could not be reached with Tab, which an open menu keeps for itself.

Only a coachmark opening or a feature being used marks a highlight seen. Show me, Nudge steps, and archive rows keep the dot available. The command menu marks use when a command runs. Layout and theme card choices mark use when a choice is applied. Exporting one image per tab, from the menu or the command, marks `tabs` used. Redact secrets, or Redact on an editor warning, marks `redact` used. Both go through `shell/export.tsx`.

In development, use `?whatsNew=nudge` or `?whatsNew=showcase` to review a view regardless of saved facts. Run `await window.resetWhatsNew()` and reload for a fresh visit. These aids are removed in production builds. `/classic` has announcements, external release links, and the export dialog's dots, with no archive. There, turning the One image per tab checkbox on marks `tabs` used, and Redact all marks `redact` used.

## The theme-card lab

`../theme-card/` still uses `picker/PickerRoute.tsx`, the old harness with one pill over the page, to step through the theme styles side by side. The pill takes `1` to `9`, the arrows and `R` to re-mount. It is review chrome for that route only and is not part of the editor.

## Delete the prototype

1. Delete the `apps/codeimage/src/prototypes/` folder.
2. In `apps/codeimage/src/index.tsx`, delete the `UnifiedEditor` import, put `<Editor />` back as the fallback of the `/` route, and delete the `classic`, `prototypes/editor-controls` and `prototypes/theme-card` routes.
