# Takumi in the new editor

The renderer preference in PR #701 now controls the new editor from PR #711. The integration has its own branch so the workers on the editor and signature branches keep their checkouts.

## Export behavior

The Experiments section reads and writes `EditorConfigStore.renderer`. It uses the existing switch control and localized renderer labels. Restore defaults also resets the renderer. Turning on Takumi does not download WASM until an export starts.

The main export and the per-tab export pass the selected renderer to `exportImage`. A per-tab batch captures the renderer once. Social sizes use the production target picker and keep their exact dimensions. Export settings show 1x while a target is active.

The Playwright check drives Inspector, Dock, and Studio. It enables Takumi, reloads, downloads a 1080×1080 PNG, and restores defaults in each layout. It also downloads and inspects a two-image ZIP.

```sh
UI_RENDERER_URL=http://localhost:4403 pnpm exec tsx scripts/parity/new-editor-renderer.ts
```

## Signature font compatibility

The published signature frontend at `83be16ad` uses a font named `CodeImage Signature`. The old adapter skipped its font-face declaration, so exported handles used the code font. Registering a variable font at the first weight in its range also forced thin text.

The adapter now reads the signature's own font-face sources. Variable faces retain their native weight range. Other code-font selection and required-font fallback rules stay in place.

The styled signature check runs against the signature frontend from PR #729. That frontend was overlaid in a disposable verification step and removed afterward. The integration does not include its API changes or saved-signature management.

- All 18 combinations of Minimal, Pill, and Card with two background tones and three positions pass. The worst signature-crop difference from Chrome is 0.1964%, under the 0.5% limit.
- All five platform icons pass in each of the three styles. These 15 checks use a dark background and the left position.
- The reference is Chrome at native display scale 2. The adapter renders the same node at export scale 2. The comparison crops the signature with 12 CSS pixels of padding and uses pixelmatch threshold 0.1.
- The completed matrices report no render errors or fallbacks. A separate run encountered a failed JetBrains Mono download and used the expected browser fallback. It is not counted as a parity pass.
- Avatar image loading, saved signatures, and the unpublished changes on #729 are outside these checks.

Run the following on a checkout that includes the styled signature frontend.

```sh
SIGNATURE_URL=http://localhost:4403 pnpm exec tsx scripts/parity/signature-renderer.ts
SIGNATURE_ALL_ICONS=1 SIGNATURE_QUICK=1 SIGNATURE_URL=http://localhost:4403 pnpm exec tsx scripts/parity/signature-renderer.ts
```

The [recorded results](media/takumi-new-editor.json) include the failing font comparison, the corrected comparison, the icon matrix, and the adapter source hash. No performance measurement was repeated.
