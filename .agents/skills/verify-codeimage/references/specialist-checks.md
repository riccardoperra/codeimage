# Run the specialist checks

Use the normal skill journeys for user behavior. Keep these checks for assertions the journeys do not replace. These commands preserve the reusable instructions from the retired execution reports; they do not certify a new run.

Install workspace dependencies, build the libraries and install the matching Playwright Chromium first. Prepare an owned development server with the intended backend and a matching MSW worker when using MSW. The scripts attach to an existing server; they do not launch or doctor it. Check readiness and capture its configuration before each run. Never drive the user's browser profile.

## Classic line marks

These P5 scripts predate the unified editor. Point them at `/classic` for their dialog and control selectors. They use internal setup as well as user actions, so they supplement the skill's user-path proof.

```sh
P5_URL=http://127.0.0.1:4200/classic P5_OUT=/tmp/codeimage-verification/import-undo node scripts/verify-p5-import-undo.cjs
P5_URL=http://127.0.0.1:4200/classic P5_OUT=/tmp/codeimage-verification/focus node scripts/verify-p5-focus.cjs
P5_URL=http://127.0.0.1:4200/classic P5_OUT=/tmp/codeimage-verification/gutter node scripts/verify-p5-gutter.cjs
P5_URL=http://127.0.0.1:4200/classic P5_OUT=/tmp/codeimage-verification/layout node scripts/verify-p5-layout.cjs
```

`verify-p5-focus.cjs` and `verify-p5-import-undo.cjs` default to a macOS Chromium cache path. They and `verify-p5-exports.cjs` accept `P5_CHROMIUM`. The gutter and layout scripts use Playwright’s installed browser instead. The scripts expose the precise fixtures and assertions in their source.

The gutter check reads `scripts/fixtures/p5-gutter/export-reference.png`. It is a reviewed test input, not a run artifact. `P5_BASELINE_PATH` overrides the reference. `P5_BASELINE` captures a candidate reference; do not replace the reviewed fixture merely to make a failed comparison pass. Check renderer, fonts, viewport and the changed pixels first.

## Renderer and signature parity

Run against the current unified editor unless the case explicitly targets classic. Use separate output directories for each command.

```sh
P2_URL=http://127.0.0.1:4200 P2_PERF=0 P2_OUT=/tmp/codeimage-verification/rasterizers pnpm exec tsx scripts/parity/rasterizers.ts
P2_URL=http://127.0.0.1:4200 P2_MARKS=1 P2_PERF=0 P2_OUT=/tmp/codeimage-verification/marked-renderers pnpm exec tsx scripts/parity/rasterizers.ts
UI_RENDERER_URL=http://127.0.0.1:4200 UI_RENDERER_OUT=/tmp/codeimage-verification/unified-renderer pnpm exec tsx scripts/parity/new-editor-renderer.ts
SIGNATURE_URL=http://127.0.0.1:4200 SIGNATURE_RATIO=1 SIGNATURE_OUT=/tmp/codeimage-verification/signature-1x pnpm exec tsx scripts/parity/signature-renderer.ts
SIGNATURE_URL=http://127.0.0.1:4200 SIGNATURE_RATIO=2 SIGNATURE_OUT=/tmp/codeimage-verification/signature-2x pnpm exec tsx scripts/parity/signature-renderer.ts
```

`rasterizers.ts` also exposes `P2_REVIEW_CASE=local-fonts`, `crossovers` and `blocked-font`, plus `P2_TARGETS=1`. Local-font checks need a browser and operating system that support the font permissions. Record unavailable prerequisites rather than treating skipped cells as passes.

The retained P2 live-lane reference is `scripts/fixtures/p2/trunk-off.png`. It preserves the original reviewed input byte-for-byte. Use it only with the matching fixture and environment; capture and review a new baseline when the trunk or fixture changes, rather than silently accepting a new image.

Additional renderer controls from the retired reports:

| Option | Use |
| --- | --- |
| `P2_LIVE=1` | Run the live lanes after the matrix. |
| `P2_MATRIX` | Read a previously captured matrix directory. |
| `P2_BASELINE` | Read a reviewed baseline PNG, such as `scripts/fixtures/p2/trunk-off.png`. |
| `P2_PATH=/classic` | Target the classic editor instead of `/`. |
| `P2_WEB_FONTS` | Select the comma-separated web-font families for local-font review. |
| `P2_SYSTEM_FONTS` | Select the comma-separated system-font families available on this machine. |
| `P2_FONT_WEIGHT` | Set the font weight under test. |
| `P2_DISPLAY_DPR` | Set the display pixel ratio for the renderer checks. |
| `CHROMIUM_PATH` | Use a specific Chromium executable. |
| `SIGNATURE_ALL_ICONS=1` | Check every platform icon. |
| `SIGNATURE_QUICK=1` | Restrict the signature background and position combinations. |

For head/base matrices and the additional export cases, follow `scripts/parity/README.md`. Preserve every nonzero diff for inspection. Keep benchmark results separate from functional results; `scripts/verify-p5-exports.cjs` measures interleaved head/trunk exports and is not replaced by a downloaded PNG. It accepts `P5_TRUNK_URL`, `P5_HEAD_URL`, `P5_OUT` and `P5_CHROMIUM`; it also accepts `P5_TOOLS_ROOT` when Playwright is installed outside the workspace. Preserve both server revisions and follow the benchmark checklist before interpreting its timings.

## Locales and shared UI

The production editor source owns dictionary parity, the locale/layout/viewport matrix and the shared export/focus review checks:

```sh
node apps/codeimage/src/prototypes/editor-controls/verify-locale-parity.mjs
node apps/codeimage/src/prototypes/editor-controls/verify-i18n.mjs http://127.0.0.1:4200 /tmp/codeimage-verification/locales
node apps/codeimage/src/prototypes/editor-controls/verify-review.mjs http://127.0.0.1:4200 /tmp/codeimage-verification/shared-ui
```

Keep those checks until their unique assertions have replacements. The source README documents their remaining controls and prerequisites.

## Evidence location

Write screenshots, recordings, measurements, profiles, traces and logs outside the checkout. The skill defaults to `/tmp`; copy evidence to durable external storage when it must outlive temporary-file cleanup. Runtime cleanup preserves the evidence directory. Retired reports and screenshots remain recoverable from Git history and need not be copied into the skill.
