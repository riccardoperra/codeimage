# Watermark placement

The existing CodeImage watermark stays in its original bottom-right position while that position is clear of code. Its SVG, width, opacity and theme remain unchanged. A collision triggers a deterministic search for another position.

The ordered candidates are the bottom-right, bottom-left, top-right and top-left of the frame, followed by the top-right of the content. As a last resort it tries the right and left ends of the title bar. Every candidate must contain the complete logo and clear the measured text and controls. Frame candidates must also clear the window and the signature's visible mark. Hidden or transparent frame backgrounds cannot host the logo.

When every candidate is occupied, the watermark stays in its original position. The algorithm does not grow the window, shrink the logo or hide it. A completely occupied window with no painted frame can therefore retain the original overlap.

## Usage and ownership

`DynamicTerminal` renders one `Watermark`. The component measures non-whitespace text fragments with DOM Ranges, including wrapped fragments. It measures tab and control boxes separately. Full-width code-line elements are not treated as text.

`placeWatermark(scene)` in `@codeimage/render/watermark` accepts geometry and returns the original position, an anchored alternative or the explicit unavoidable case. It has no DOM, framework or persisted state. Repeating the calculation on the same scene produces the same result.

The component preserves an empty home anchor while the single SVG renders through a Portal at the chosen host. This escapes the content and window clipping without changing their overflow rules. Positions convert viewport geometry back to the host's coordinates, retaining the fitted-window scale.

### The scope

Each frame owns one watermark scope, created in `core/watermark/scope.ts`. `Frame` creates it for the live canvas and `FrameView`, the frame body of every `PreviewFrame`, creates one per preview, so per-tab exports never share state. `FittedWindow` provides it to the window inside the frame. The scope holds typed parts, and each part is registered by the component that renders it. A registration lasts until that component's owner is disposed.

| Part                  | Registered by                                                                      |
| --------------------- | ---------------------------------------------------------------------------------- |
| `frame`, `background` | `Frame` and `FrameView`                                                            |
| `signature`           | `FrameSignature`, through `markRef`, on the edit button or the visible mark        |
| `window`              | `TerminalHost`                                                                     |
| `header`, `content`   | each window style: `MacOsTerminal`, `WindowsTerminal`, `WindowStyles`              |
| `code`                | `CanvasEditor` with its `EditorView`, or `StaticCodeView` with its content element |
| `fit`                 | `FittedWindow`, which applies the fitted transform synchronously                   |
| `measure`             | `Watermark`, while it is shown                                                     |

`Watermark` throws when it renders outside a frame. Every other component that uses the scope renders unchanged without one, which keeps theme thumbnails and window previews working.

The Node renderer renders the same `FrameView`, so the watermark finds its scope there too. Parts register only through refs, effects and `onMount`, which server rendering never runs, so the scope stays empty and schedules nothing in Node. The Node renderer places the logo from Takumi geometry instead.

Two lookups remain local selectors, both defined by `WATERMARK` in `@codeimage/render/watermark`. The window is still queried for `WATERMARK.obstacles` (`[data-watermark-obstacle], button, [role=tab]`), because tab, add, close and control buttons have no single owner that could register them. The code source still finds `WATERMARK.codeClass` (`.cm-line`) elements inside its own root, because walking the full CodeMirror content would add block widgets to the occupied text. Both lookups stay inside the registered window or code root. The `data-watermark-*` attributes stay on their elements for the browser verifier.

### Invalidation

`scope.invalidate()` schedules one measurement. Calls before it runs coalesce. A measurement reads the full scene and the host coordinate conversion first, then writes only the placement dataset, the placeholder height and the Portal.

A live editor schedules through `view.requestMeasure` with one stable key, so the reads join CodeMirror's own measure cycle. A static preview schedules on the next animation frame. Registering or removing any part cancels the queued job and schedules a new one, so a request queued on a destroyed editor cannot leave the scope pending.

These sources invalidate the scope:

- A CodeMirror plugin, on geometry or viewport changes and on every doc view update. It never reads layout itself.
- `StaticCodeView`, when its text, theme, marks or font configuration changes.
- A ResizeObserver on the registered frame, window, content, header, signature and code root.
- A MutationObserver on the header, for tab renames, added or removed tabs and active-tab changes that need not resize anything.
- A MutationObserver on the frame background, for color, opacity, visibility and background image changes.
- `FittedWindow`, when its fit changes the window transform.
- The frame, when the signature's alignment changes without resizing its mark.
- Scroll inside the frame, and font loading.

### Export

`FrameView` binds its scope to the wrapper element it passes to `props.ref`, which is the element `PreviewFrame` hands to the export. `exportImage` calls `prepareWatermark(ref)` with that same element before the DOM or Takumi renderer runs. Preparation waits for fonts, applies the fit synchronously, then reads and writes the placement synchronously. An element with no bound preview, or a preview with the watermark off, resolves at once.

## Design decision

The selected design combines fixed ranked positions with local component ownership. A continuous search through arbitrary whitespace was rejected because it can move the logo after small edits and place it among code. Placement history was rejected because a newly mounted per-tab export must make the same decision as an existing frame from the same geometry.

No stage-wide placement provider, duplicate hidden SVG or new user setting is needed. The browser measurement adapter handles zoom and DOM details. The pure function owns collision and placement policy.

The browser imports only the pure `@codeimage/render/watermark` subpath. The package root imports Node filesystem utilities and Takumi and must never enter the browser graph. The Node renderer supplies geometry measured with Takumi and the same font resources used for the final image. Both adapters call the same policy.

A separate geometry package was considered. It would expose the same scene and function while adding another manifest and build unit. The pure subpath keeps one rule without that extra package. Its independent build entry must exist before the app SSR build, because that build itself imports the policy.

Animated capture requires an occupancy envelope for the complete animation and is not integrated here.

## Verification

Run the focused browser journey with:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=watermark node .agents/skills/verify-codeimage/scripts/verify.mjs
```

Set `VERIFY_WATERMARK_EXTRA=1` to also check text edits that preserve the code box dimensions and short-signature alignment changes. These checks do not add records to the baseline comparison.

Set `ARTIFACT_DIR` to keep the evidence. Compare two runs, such as before and after a change to this code, with:

```sh
node .agents/skills/verify-codeimage/scripts/compare-watermark.mjs BEFORE_DIR AFTER_DIR
```

The journey drives window styles and code through the UI, records live/export geometry, and downloads images. Its mock backend boundary is the same as the rest of the verification skill. Policy tests in `packages/render/src/watermark.test.ts` cover unchanged positioning, blocked controls, signature collision, unavailable frame space and scaling. Scope tests in `core/watermark/scope.test.ts` cover export preparation order, isolated previews, disposal, coalescing and a removed editor's queued request.

Generate the CLI parity documents with `pnpm exec tsx scripts/parity/watermark-cases.mjs`.
After `pnpm libs:build`, compare their actual web downloads and CLI PNGs with
`P10_WEB_OUT=/tmp/codeimage-cli-watermark/parity pnpm exec tsx scripts/parity/watermark-cli-vs-web.ts /tmp/codeimage-cli-watermark/cases/*.json`.
The documents cover all seven window types, four padding values, hidden and transparent frames, header off, signatures, fonts, tabs and portrait output.
CLI width is a minimum, so the width-minimum case verifies content expansion rather than forced wrapping.

The runner asserts equal watermark slots from browser geometry and Takumi geometry. It records full-image pixel differences separately, including size drift between rasterizers.
