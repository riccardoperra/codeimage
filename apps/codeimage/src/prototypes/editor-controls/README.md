# Editor controls prototype

This folder holds several layouts of the editor screen and several ways to draw a theme, behind two pickers, so you can compare every pair on the real editor. It follows the `prototype` skill from [emilkowalski/skills](https://github.com/emilkowalski/skills). A second route, `../theme-card/`, shows the three theme pickers alone next to the canvas. Nothing in production imports from `prototypes/`. The only production change is two routes in `apps/codeimage/src/index.tsx`.

## Run it

1. Start the app as usual, for example `pnpm exec vite --port 4321 --strictPort` from `apps/codeimage`.
2. Open `http://localhost:4321/prototypes/editor-controls`. The theme pickers alone are at `http://localhost:4321/prototypes/theme-card`.

Two pills sit at the top of the page. The first picks the layout, the second picks the theme style that every layout uses for its theme picker.

| Pill        | Choices                          | Keys                                                   | URL parameter |
| ----------- | -------------------------------- | ------------------------------------------------------ | ------------- |
| Layout      | Current, Inspector, Dock, Studio | `1` to `4`, the left and right arrows, `R` to re-mount | `v`           |
| Theme style | Window, Orb, Aa list             | `W`, `O`, `A`, or `[` and `]` to step                  | `t`           |

A reload keeps both choices. The keys do nothing while focus is in a field, a select, a list, a menu, a dialog or another composite widget, while a list or popup that the page opened is open, or while a modifier key is held. The theme list is the one list they reach: it keeps the arrows and Escape, and the digits and letters still switch the pills. Current renders today's production editor with its own theme panel, so the theme style pill is dimmed there.

The page opens in the Window style, which Riccardo chose. Orb and Aa list stay as alternatives.

The pills sit above the page and below the popovers and dialogs that the page opens. Where they would cover a control of the page, as on a narrow window, the harness starts the page under them.

The prototype uses the same stores as `/`. Changes you apply here are saved to the same local document that `/` opens. A preview is never saved.

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

- `meta`, a `VariantMeta` with the `name` shown in the picker and the `axis` the layout explores. `ownThemePicker: true` marks a layout that ignores the theme style, and `noCommandMenu: true` one that gets no command menu. Only Current sets them.
- A default export, a `Component<VariantProps>` that lays out the whole editor screen.

`VariantProps` has the `model`, a `stage`, and a `ThemePicker`.

The stage, from `stage.tsx`, holds the parts of the real editor that a layout places:

- `Canvas` renders the live frame with the CodeMirror editor. It fills its parent and zooms the frame out when the frame is larger than the space it gets, so give it a parent with a definite size. Render it exactly once.
- `ExportButton` and `CopyToClipboardButton` are the production buttons, bound to the canvas.
- `randomize()`, `format()`, and `canFormat()` are the frame toolbar actions.
- `ThemePreview` draws the mini editor of today's theme cards for one entry of `model.themes()`.
- `exportRef()` is the element that export captures. Pass it to any other production component that takes a `canvasRef` or a `frameRef`, such as `Toolbar` or `FrameToolbar`.

`ThemePicker` is the theme picker in the style chosen in the second pill: search, the dark and light filter, and every theme. Place it where your layout shows themes, in a container with a definite height, and it fills it. Its optional props are `size` (`'md'` for the kit fields on touch layouts), `autofocus` (focus the selected theme on mount, for a tray or a sheet) and `onPick(theme, byKeyboard)`.

`ThemeSwatch`, from `ThemeSwatch.tsx`, draws one theme as a small mark, for example in a button that shows the applied theme. Without a `variant` it draws the mark of the chosen style. The marks are `syntax-orb`, `aa`, and `window`. `window` also takes a `width`, in px or `fill`. With `fill`, `window` keeps the default frame's shape, about 5 to 4, and grows with its card.

The harness creates a new stage for each mount and keeps one model for the whole session. `registry.ts` lists the layouts in picker order. You do not edit it. It reads `meta` from your folder. `ModelDump.tsx`, a plain list of every control with native inputs, is no longer used by a layout and can start a new one.

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

`command-menu/` holds one command menu for every layout but Current. The harness mounts it and binds Cmd+K, or Ctrl+K off Apple platforms. No layout has to do anything to get it.

- It lists every theme, every option of every visible control, every background fill, and the actions Export, Randomize and Format. `listed-model.ts` turns the window style and the font, which the model hands out as production pickers, into plain choices over the same stores, so that they can be listed too.
- The highlighted row is previewed on the canvas through the model's preview session. Enter saves it. Escape, or any other way out, ends the preview.
- It floats at the bottom centre with no scrim and is six rows tall, so the frame stays in view while the list is walked.
- It does not open over an open list, menu, popover or modal dialog. A layout that wants it to open anyway closes what it has open first: `commandMenu.beforeOpen(close)`.
- A layout adds a button with `commandMenu.open` and shows `commandMenu.shortcut` beside it, as Dock and Studio do. Both come from `command-menu/state.ts`.
- `commandMenu.setReveal(id => ...)` lets a layout answer a command for a control that has no values to list, such as the image upload, by showing where the control lives. Without it the menu leaves those commands out.

## Rules for builders

- Edit only your own `variants/<slug>/` folder. Set your `axis` in your `meta`.
- Style with the tokens from `@codeimage/ui` (`themeVars`) in vanilla-extract `.css.ts` files inside your folder. Plain CSS is fine if every selector starts with a class that belongs to your folder.
- Add no dependency without saying so in your report.
- Show themes with `props.ThemePicker`, not with a grid of your own, so that the theme style pill reaches your layout.
- Render rows with `controls/ControlRow`, not with fields of your own.
- Keep the top center of the page free of controls: the pills float there.
- A popover that closes on outside clicks should treat `[data-prototype-chrome]` as inside, so that switching the theme style keeps it open.
- `SegmentedField` with `adapt` makes the kit control `height: 100%`. Under a parent of auto height that falls back to its line height, about 24px. Give the parent the kit's field height, 36px at `sm` or 40px at `md`.
- The pickers listen for keys on `document`. Solid delegates `onKeyDown` to `document` too, so `stopPropagation()` in an `onKeyDown` handler does not keep a key from them. Use a native `on:keydown` listener on your element, or give the element a composite role such as `listbox`. A composite that stops the keys it uses in a native listener can add `data-passes-keys`, so that the pickers still get the others.

## Delete the prototype

1. Delete the `apps/codeimage/src/prototypes/` folder.
2. Delete the `prototypes/editor-controls` and `prototypes/theme-card` routes from `apps/codeimage/src/index.tsx`.
