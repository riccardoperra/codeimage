# CLI watermark verification

The CLI and browser use one adaptive watermark policy. The existing logo, width 125, opacity 0.35 and window theme tone stay unchanged.

## Architecture

`@codeimage/render/watermark` exports the pure `WatermarkScene` and `placeWatermark` function. The browser imports this leaf. The Node renderer measures shaped text with Takumi, using its registered fonts and font loaders, then supplies the same scene model. The package root remains Node-only.

Three shapes were considered. A separate package adds another build unit for the same API. The app-owned candidate proposed exporting layout trees through the host contract and adding an SSR placement context and render pass. The selected pure subpath keeps the host contract small and lets the Node adapter own Takumi measurement and final markup. It builds the leaf before the app SSR bundle to avoid a build bootstrap cycle.

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

The revised run passed all 31 slot and actual PNG ink comparisons, including three alternate transparent color spellings and output scales 2 and 3. The largest measured ink-edge delta was 1 output pixel after accounting for the image-size difference at right and bottom anchors. The allowed tolerance is 2 output pixels. The CLI images were inspected together, with full-size checks for home, moved, social and split-tab examples. The 1080×1350 SVG parsed with the expected dimensions.

The native run passed 75 tests, including real SSR measurement drift and output-scale checks. The CLI suite passed 92 tests. App, renderer and CLI typechecks passed, as did focused lint and formatting.

Full-image pixel parity remains incomplete. The portrait case differs by 0.05%. Several other documents differ by one pixel in output width; equal-size cases also show rasterization differences. These results prove equal selected slots and bounded ink-edge positions for this matrix, not identical rendering or exact coordinates for every possible document. The measurements and image hashes are committed in `cli-watermark-results.tsv`.

## Independent review corrections

Claude Opus 5.5 proved that raw transparent color spellings could select a frame slot in Node while the browser selected the header. Both adapters now use `canHostWatermarkFrame`. Node first samples the actual background color with Takumi to normalize its alpha; the browser supplies its computed color. Shared constants define logo width, opacity, gap, frame inset and stacking.

The synthetic padding test proves pixel identity only for its existing word spans. Splitting a real SSR string token into measurement spans can change shaping and antialiasing. The independent probe observed about 0.115 CSS px of coordinate drift. Final output uses the original token markup, so this drift affects placement measurement rather than the painted code. A real SSR regression separately checks unchanged frame dimensions and bounds changed measurement pixels below 1%. This is a tolerance, not a proof of exact text geometry on every boundary.

The revised parity runner isolates watermark ink by subtracting real exports with the watermark disabled. It compares CLI and browser ink edges within 2 output pixels, accounting for a right or bottom anchor when image dimensions differ. It writes the edge measurements beside the images. A compact committed results file preserves the measurements and image hashes for PR review. Slot equality from `snapshotMarkup` is an additional diagnostic, not the only output check. Measurement now uses the final output pixel ratio and normalizes the geometry back to CSS coordinates.

The live UI audit was repeated after the review fixes using the unmodified verification scripts from main commit `64d46a07`. All 31 scenarios passed, including wrapped live editing, live controls, social Takumi export and per-tab ZIP. Evidence is in `/tmp/codeimage-cli-watermark/review-live`. The temporary scripts were removed after their owned browser and server exited. Animation remains outside this run.

The browser now also needs the pure watermark build output before dev or typecheck. The normal `libs:build` sequence supplies it. The isolated subpath is built first, before SSR, and contains no Node imports.

The committed measurements were collected on macOS arm64 with Node 26.5.0 and Takumi 2.19.0. Ink boxes in the TSV use left, top, right, bottom coordinates. Edge deltas use left, right, top, bottom after anchor normalization.
