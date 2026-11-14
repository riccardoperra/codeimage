# Editor controls prototype

This folder holds several versions of the editor screen behind a picker, so you can compare them on the real editor. It follows the `prototype` skill from [emilkowalski/skills](https://github.com/emilkowalski/skills). Nothing in production imports from this folder. The only production change is one route in `apps/codeimage/src/index.tsx`.

## Run it

1. Start the app as usual, for example `pnpm exec vite --port 4321 --strictPort` from `apps/codeimage`.
2. Open `http://localhost:4321/prototypes/editor-controls`.
3. Press `1` to `4`, or the left and right arrows, to switch variants. Press `R` to re-mount the current variant.

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
model.themes(): {id; name; dark; colors: {background; window; text}; active(): boolean; apply(): void}[];
```

`visible()` is false where today's sidebar hides a row, for example opacity while the frame is hidden. A choice control's `value()` is the key of the selected option. Three options are `custom` because they need the production picker: `frame.backgroundImage` (image upload), `window.style` (window previews), and `font.family` (web and system fonts).

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
- `ThemeSwatch`, from `ThemeSwatch.tsx`, draws a colour orb for one entry of `model.themes()`. Use it for theme cards. A code thumbnail at card size does not say which theme it is, and the live canvas is the preview.
- `exportRef()` is the element that export captures. Pass it to any other production component that takes a `canvasRef` or a `frameRef`, such as `Toolbar` or `FrameToolbar`.

The harness creates a new stage for each mount, and keeps one model for the whole session. `registry.ts` lists the variants in picker order: Current, Inspector, Dock, Studio. You do not edit it. It reads `meta` from your folder.

`current` renders today's `App` unchanged, as the reference. `inspector`, `dock`, and `studio` start as placeholders. Each one renders the stage next to `ModelDump`, a plain list of every control and theme with native inputs.

## Rules for builders

- Edit only your own `variants/<slug>/` folder. Set your `axis` in your `meta`.
- Style with the tokens from `@codeimage/ui` (`themeVars`) in vanilla-extract `.css.ts` files inside your folder. Plain CSS is fine if every selector starts with a class that belongs to your folder.
- Add no dependency without saying so in your report.
- To stop using the dump, remove the `ModelDump` import from your folder. Do not edit or delete `ModelDump.tsx`, because the other placeholders use it.
- The picker floats at the top center of the screen. Keep that spot free of controls.

## Delete the prototype

1. Delete the `apps/codeimage/src/prototypes/` folder.
2. Delete the `prototypes/editor-controls` route from `apps/codeimage/src/index.tsx`.
