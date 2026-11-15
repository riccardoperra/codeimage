# CLI watermark verification

The CLI and browser use one adaptive watermark policy. The existing logo, width 125, opacity 0.35 and window theme tone stay unchanged.

## Architecture

`@codeimage/render/watermark` exports the pure `WatermarkScene` and `placeWatermark` function. The browser imports this leaf. The Node renderer measures shaped text with Takumi, using its registered fonts and font loaders, then supplies the same scene model. The package root remains Node-only.

Three shapes were considered. A separate package adds another build unit for the same API. Keeping the policy in the app would require exporting layout trees through the host contract and adding an SSR placement context and render pass. The selected pure subpath keeps the host contract small and lets the Node adapter own Takumi measurement and final markup. It builds the leaf before the app SSR bundle to avoid a build bootstrap cycle.

Model the Domain preserves the existing scene structure instead of adding another ranking algorithm. Prove It Works requires actual shaped runs, native PNGs and browser downloads before accepting the adapter.

## Stack

GitHub reported #752 merged into main at the start of this session. #745, #741 and #702 remained open. This branch targets `feat/p11-cli-fonts-on-demand`. It ports the exact #752 change onto that stack, then moves the policy and migrates both consumers. A full merge of main was tried locally and replaced because it brought unrelated cleanup into this PR. No shared branch was rewritten.

## Reproduction

Build with `pnpm install --frozen-lockfile` and `pnpm libs:build`.
Run the policy, native geometry and renderer tests with `pnpm --filter=@codeimage/render exec vitest run src/watermark.test.ts src/watermarkGeometry.test.ts src/render.test.ts --pool threads --maxWorkers 1`.
Run CLI tests with `pnpm --filter=@codeimage/cli test`.

Generate documents with `pnpm exec tsx scripts/parity/watermark-cases.mjs`.
Run `P10_WEB_OUT=/tmp/codeimage-cli-watermark/parity pnpm exec tsx scripts/parity/watermark-cli-vs-web.ts /tmp/codeimage-cli-watermark/cases/*.json`.
The runner compares policy slots and writes actual web and CLI PNGs. It reports full-image pixel drift separately. Equal slots do not establish pixel parity.

The CLI's width is a minimum. Long lines expand the window rather than wrap. The browser journey from main separately exercised wrapped text, live controls, social output and per-tab ZIP exports.

## Local evidence

The session evidence directory is `/tmp/codeimage-cli-watermark`. It is temporary and is not needed to rerun the committed checks. `web-audit-2` contains the passing live browser watermark journey and PNG download, performed with main's committed verification procedure before narrowing the integration commit. `render-tests.log` contains the native test output. The parity runner writes a table beside the paired images.

## Observed results

The final run passed all 26 slot comparisons and produced both real PNGs for every document. The CLI images were inspected together, with full-size checks for home, moved, social and split-tab examples. The 1080×1350 SVG parsed with the expected dimensions.

The native run passed 56 tests, including the padding correction's pixel-buffer identity check. The CLI suite passed 92 tests. App, renderer and CLI typechecks passed, as did focused lint and formatting.

Full-image pixel parity remains incomplete. The portrait case differs by 0.05%. Several other documents differ by one pixel in output width; equal-size cases also show rasterization differences. These results prove equal selected slots for this matrix, not identical rendering or equal coordinates for every possible document.
