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

The layout, the side of the Inspector panel and the theme card style are settings. Change them in the settings dialog, which the gear in the header opens, or in the command menu. Two URL parameters pick a layout and a style for a link, with no visible control:

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
- A default export, a `Component<VariantProps>` that lays out the whole editor screen.

`VariantProps` has the `model`, a `stage`, and a `ThemePicker`.

The stage, from `stage.tsx`, holds the parts of the real editor that a layout places:

- `Canvas` renders the live frame with the CodeMirror editor. It fills its parent and zooms the frame out when the frame is larger than the space it gets, so give it a parent with a definite size. Render it exactly once.
- `ExportButton` and `CopyToClipboardButton` are the production buttons, bound to the canvas.
- `randomize()`, `format()`, and `canFormat()` are the frame toolbar actions.
- `ThemePreview` draws the mini editor of today's theme cards for one entry of `model.themes()`.
- `exportRef()` is the element that export captures. Pass it to any other production component that takes a `canvasRef` or a `frameRef`, such as `FrameToolbar`.

`ThemePicker` is the theme picker in the card style chosen in the settings: search, the dark and light filter, and every theme. Place it where your layout shows themes, in a container with a definite height, and it fills it. Its optional props are `size` (`'md'` for the kit fields on touch layouts), `autofocus` (focus the selected theme on mount, for a tray or a sheet) and `onPick(theme, byKeyboard)`.

`ThemeSwatch`, from `ThemeSwatch.tsx`, draws one theme as a small mark, for example in a button that shows the applied theme. Without a `variant` it draws the mark of the chosen style. The marks are `syntax-orb`, `aa`, and `window`. `window` also takes a `width`, in px or `fill`. With `fill`, `window` keeps the default frame's shape, about 5 to 4, and grows with its card.

`harness.tsx` exports `UnifiedEditor`, the page behind `/` and `/prototypes/editor-controls`. It renders the chosen layout, the command menu and the settings dialog. It creates a new stage for each mount of a layout and keeps one model for the whole session. `registry.ts` maps each layout id to its folder and reads `meta` from it. Today's editor is no longer a layout: it is the production route `/classic`. `ModelDump.tsx`, a plain list of every control with native inputs, is no longer used by a layout and can start a new one.

## The shell

`shell/` holds what every layout shares around the canvas: the header and the settings.

- `Header.tsx` is the compact header, 44px tall with no bar of its own, so it floats on the app background. It holds the logo, the dashboard link and the snippet name where production shows them, the gear that opens the settings, and the production Share, Export and sign-in or user badge. A layout renders `<Header stage={props.stage} />` at its top, in place of the production `Toolbar`.
- `SettingsDialog.tsx` is the one settings surface, a kit `Dialog`. Its sections are Layout (three cards, each with a small drawing of the layout, and the panel side while Inspector is chosen), Theme cards (three cards, each drawn with the applied theme), Appearance (colour mode and language, the two settings production has today) and About (changelog, GitHub, log out). The harness mounts it once.
- `settings-state.ts` exports `settings.open`, `settings.close` and `settings.isOpen`. Closing returns focus to what opened it, or to the gear when a layout change replaced the header.
- `preferences.ts` keeps the three choices in local storage under the one key `codeimage:prototype-settings`, as `{layout, inspectorSide, themeCards}`. Without stored choices the editor opens in Inspector with the panel on the right and Window cards.
- `commands.ts` lists the same choices as commands for the command menu.
- `previews.tsx` draws the small layout wireframes.

The harness sets `data-layout` on the page root, `.proto-variant`. While Inspector is chosen it also sets `data-inspector-side="left|right"`, on `.proto-variant` and on the root element that the layout renders, so a layout can read it from either.

The old menu at the top left of the header is gone. Its entries moved:

| Old entry | New home                                                         |
| --------- | ---------------------------------------------------------------- |
| Settings  | The gear in the header, and the `Settings…` command              |
| Changelog | Settings, About, and the `Changelog` command                     |
| GitHub    | Settings, About, and the `CodeImage on GitHub` command           |
| Logout    | The user badge's menu, Settings, About, and the `Logout` command |

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

- It lists every theme, every option of every visible control, every background fill, the actions Export, Randomize and Format, and the settings: `Settings…`, each layout, the Inspector side, each theme card style, the colour mode, and what the old header menu held. `listed-model.ts` turns the window style and the font, which the model hands out as production pickers, into plain choices over the same stores, so that they can be listed too.
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
- Start the layout with `<Header stage={props.stage} />` from `shell/Header`, not with the production `Toolbar`.
- The page root stays in normal flow. A fixed root lets the body collapse, and the body then clips the kit popovers portaled to it.
- Render rows with `controls/ControlRow`, not with fields of your own.
- `SegmentedField` with `adapt` makes the kit control `height: 100%`. Under a parent of auto height that falls back to its line height, about 24px. Give the parent the kit's field height, 36px at `sm` or 40px at `md`.
- Solid delegates `onKeyDown` to `document`, so `stopPropagation()` in an `onKeyDown` handler does not keep a key from another listener on `document`, such as the command menu's shortcut. Use a native `on:keydown` listener where propagation matters.

## The theme-card lab

`../theme-card/` still uses `picker/PickerRoute.tsx`, the old harness with one pill over the page, to step through the theme styles side by side. The pill takes `1` to `9`, the arrows and `R` to re-mount. It is review chrome for that route only and is not part of the editor.

## Delete the prototype

1. Delete the `apps/codeimage/src/prototypes/` folder.
2. In `apps/codeimage/src/index.tsx`, delete the `UnifiedEditor` import, put `<Editor />` back as the fallback of the `/` route, and delete the `classic`, `prototypes/editor-controls` and `prototypes/theme-card` routes.
