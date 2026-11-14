# Editor controls prototype

This folder holds several versions of the editor screen behind a picker, so you can compare them on the real editor. It follows the `prototype` skill from [emilkowalski/skills](https://github.com/emilkowalski/skills). A second prototype, `../theme-card/`, reuses this folder's model, stage, and picker to compare ways of drawing a theme. Nothing in production imports from `prototypes/`. The only production change is two routes in `apps/codeimage/src/index.tsx`.

## Run it

1. Start the app as usual, for example `pnpm exec vite --port 4321 --strictPort` from `apps/codeimage`.
2. Open `http://localhost:4321/prototypes/editor-controls` for the layouts, or `http://localhost:4321/prototypes/theme-card` for the theme pickers.
3. Press a number key, or the left and right arrows, to switch variants. Press `R` to re-mount the current variant.
4. Add `&t=<style>` to draw every theme swatch in another style. See the swatch styles below.

The picker writes the choice to `?v=N`, so a reload keeps it. The keys do nothing while focus is in an input, a select, or the code editor.

The prototype uses the same stores as `/`. Changes you make here are saved to the same local document that `/` opens.

## The model in ten lines

`model.tsx` turns every option of today's sidebar into data. `createEditorControlsModel()` returns:

```ts
type Control = {id: ControlId; label(): string; visible(): boolean} & ( // id is 'frame.padding', ...
	| {kind: 'toggle'; value(): boolean; set(value: boolean): void}
	| {kind: 'segmented' | 'select'; options(): {key: string; label: string}[]; value(): string; set(key: string): void; disabled(): boolean}
	| {kind: 'range'; value(): number; set(value: number): void; min: number; max: number; step: number}
	| {kind: 'number'; value(): number; set(value: number): void; min: number; max: number}
	| {kind: 'background'; value(): string; set(value: string): void; colors: string[]; gradients: string[]}
	| {kind: 'custom'; Control: Component}); // the production control, already bound to the store
model.sections: {id: 'frame' | 'window' | 'editor' | 'font'; label(): string; controls: Control[]}[];
model.control(id: ControlId): Control | undefined;
model.themes(): {id; name; dark; colors: {background; window; text; syntax}; active(): boolean; apply(): void; preview(): void}[];
model.endThemePreview(): void;
```

`visible()` is false where today's sidebar hides a row, for example opacity while the frame is hidden. A choice control's `value()` is the key of the selected option. Three options are `custom` because they need the production picker: `frame.backgroundImage` (image upload), `window.style` (window previews), and `font.family` (web and system fonts).

`colors.syntax` holds the colour the code editor gives each token in that theme: `base`, `keyword`, `string`, `function`, `number`, `comment`, `type`, and `property`. `syntax.ts` reads them back from the theme's CodeMirror extensions through public API: `highlightingFor()` gives the classes for a tag, and the theme's style modules give the colour of those classes. A token that the theme does not colour gets `base`, which is how the editor draws it.

`preview()` shows a theme on the canvas without saving it. `active()` stays on the applied theme during a preview. `endThemePreview()` puts the applied theme back, and `apply()` makes the previewed theme the applied one.

The model leaves out the presets panel, the theme search box, and the app settings menu. Import `PresetSwitcher`, `ThemeSwitcher`, or `ToolbarSettingsButton` from `components/` if your variant needs them.

## The variant contract

Each variant is a folder, `variants/<slug>/index.tsx`, that exports two things:

- `meta`, a `VariantMeta` with the `name` shown in the picker and the `axis` the variant explores.
- A default export, a `Component<VariantProps>` that lays out the whole editor screen.

`VariantProps` has the `model` and a `stage`. The stage, from `stage.tsx`, holds the parts of the real editor that a variant places:

- `Canvas` renders the live frame with the CodeMirror editor. It fills its parent and zooms the frame out when the frame is larger than the space it gets, so give it a parent with a definite size. Render it exactly once.
- `ExportButton` and `CopyToClipboardButton` are the production buttons, bound to the canvas.
- `randomize()`, `format()`, and `canFormat()` are the frame toolbar actions.
- `ThemePreview` draws the mini editor of today's theme cards for one entry of `model.themes()`.
- `ThemeSwatch`, from `ThemeSwatch.tsx`, draws one entry of `model.themes()` as a small mark. Use it for theme cards. A code thumbnail at card size does not say which theme it is, and the live canvas is the preview. `<ThemeSwatch theme={theme} size={56} />` draws the style that the `t` URL parameter names, or `orb` without one. Pass `variant` to fix the style. The styles are `orb` (frame background and window colour), `syntax-orb` (blobs of the keyword, string, and function colours), `aa` ("Aa" in the keyword and string colours), `palette` (six syntax colours as dots), and `window` (a window with code-coloured bars on the frame background). `palette` and `window` also take a `width`.
- `exportRef()` is the element that export captures. Pass it to any other production component that takes a `canvasRef` or a `frameRef`, such as `Toolbar` or `FrameToolbar`.

The harness creates a new stage for each mount, and keeps one model for the whole session. `registry.ts` lists the variants in picker order: Current, Inspector, Dock, Studio. You do not edit it. It reads `meta` from your folder.

`current` renders today's `App` unchanged, as the reference. `inspector`, `dock`, and `studio` start as placeholders. Each one renders the stage next to `ModelDump`, a plain list of every control and theme with native inputs.

## Rules for builders

- Edit only your own `variants/<slug>/` folder. Set your `axis` in your `meta`.
- Style with the tokens from `@codeimage/ui` (`themeVars`) in vanilla-extract `.css.ts` files inside your folder. Plain CSS is fine if every selector starts with a class that belongs to your folder.
- Add no dependency without saying so in your report.
- To stop using the dump, remove the `ModelDump` import from your folder. Do not edit or delete `ModelDump.tsx`, because the other placeholders use it.
- The picker floats at the top center of the screen. Keep that spot free of controls.
- The picker listens for arrow keys on `document`. Solid delegates `onKeyDown` to `document` too, so `stopPropagation()` in an `onKeyDown` handler does not keep the arrows from switching variants. Use a native `on:keydown` listener on your element to keep arrow keys for your own widget.

## The theme-card prototype

`../theme-card/` asks one question: how should the theme picker draw a theme? Each direction in `theme-card/directions/` is a complete picker in an island next to the live canvas, under the production `Toolbar`. `ThemePickerScreen.tsx` holds the layout, the search field, and the dark and light filter. `browser.ts` holds the behaviour that every direction shares:

- Hover or keyboard focus previews a theme on the canvas. Leaving the list, or pressing Escape, puts the applied theme back.
- A click, Enter, or Space applies the theme.
- The arrow keys move through the options as they sit on screen, in a list or in a grid.

The directions are Code, Orb, Aa list, Palette, and Window, in `theme-card/registry.ts`.

## Delete the prototype

1. Delete the `apps/codeimage/src/prototypes/` folder.
2. Delete the `prototypes/editor-controls` and `prototypes/theme-card` routes from `apps/codeimage/src/index.tsx`.
