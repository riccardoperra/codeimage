# Takumi in the new editor

The renderer preference from PR #701 controls the new editor from PR #711. The integration has its own branch so the editor and signature workers keep their checkouts.

With main through `89200f59`, code head `bda4e87f` passes 59 app tests, typecheck, lint, and the production build on Node 24 with the frozen lockfile. Exit codes are recorded; lint retains existing warnings.

## Export behavior

Experiments reads and writes `EditorConfigStore.renderer`. Restore defaults resets it. Turning on Takumi does not download WASM until an export starts. The normal export and per-tab export use the same choice. A per-tab batch captures it once.

Social sizes use the production target picker. Export settings, the button, the dropdown and the command menu show the effective scale. A target fixes it at 1x and removes ineffective scale commands.

The UI probe selects Square through the picker in Inspector, Dock and Studio. It checks the button and command-menu summaries, downloads a 1080×1080 PNG and restores defaults. It enables Takumi through the UI for the ZIP, counts two calls to the actual WASM renderer and inspects both PNG entries.

Persistence checks confirm the value in IndexedDB before reload, then wait for the hydrated switch. Five reloads pass in each layout. Immediate unload while a write is pending is outside this check. Earlier immediate-read assertions failed in two runs, so those runs are not persistence passes. One also recorded a development-server module-fetch error.

```sh
UI_RENDERER_URL=http://localhost:4403 pnpm exec tsx scripts/parity/new-editor-renderer.ts
```

## Fonts and the current signature frontend

The adapter collects the primary font families used by exported text. It loads their declared font-face sources, without a hardcoded signature family name. A failed used face triggers the existing browser fallback. The bundled optional UI fallback fonts retain their previous behavior.

Variable font ranges do not force a face to the first weight in the range. A regression test uses a renamed text font and asserts the absence of a forced weight. Another rejects a failed used text face. Geist Mono and Monaspace Argon also pass real image comparisons with code rendered at weight 700.

The current styled signature frontend at `24a636d8` was overlaid for rendering checks and removed afterward. Its enlarged marks and current platform icons were included. This integration does not include the signature API or saved-signature management.

- All 18 style, tone and position combinations pass at native display 1 and export 1, using the production `exportImage` path with a Square target.
- The same 18 combinations pass at native display 2 and export 2 with a free frame of the same dimensions.
- All five platform icons pass in each of the three styles at 1x.
- The limit is 0.5% different pixels in the signature crop. The crop includes 12 CSS pixels of padding and uses pixelmatch threshold 0.1. The completed matrices have no render errors, font network failures or browser fallbacks.
- The signature matrices select bundled Geist Mono for code, avoiding a dependency on the external default code-font download. The signature uses its own actual Inter files.
- Avatar loading, signature CRUD and later #729 changes are outside these checks.

Two earlier separate-session probes each reported three required JetBrains Mono read failures. No HTTP status was captured, so the cause is unknown. They are recorded separately and are not parity passes.

An intermediate 2x probe omitted its ratio argument and produced NaN. Those results were discarded. Native 1x captures also replace downsampled Retina captures as the native 1x reference. No font or SVG workaround was added for these probe errors.

Run the signature commands on a checkout that includes the styled signature frontend.

```sh
SIGNATURE_RATIO=1 SIGNATURE_URL=http://localhost:4403 pnpm exec tsx scripts/parity/signature-renderer.ts
SIGNATURE_RATIO=2 SIGNATURE_URL=http://localhost:4403 pnpm exec tsx scripts/parity/signature-renderer.ts
SIGNATURE_RATIO=1 SIGNATURE_ALL_ICONS=1 SIGNATURE_QUICK=1 pnpm exec tsx scripts/parity/signature-renderer.ts
P2_URL=http://localhost:4403 P2_PATH=/classic P2_REVIEW_CASE=local-fonts P2_WEB_FONTS='Geist Mono,Monaspace Argon' P2_SYSTEM_FONTS='' P2_FONT_WEIGHT=700 P2_PERF=0 pnpm exec tsx scripts/parity/rasterizers.ts
```

The [recorded results](media/takumi-new-editor.json) include the original font failure, current signature and code-font comparisons, UI checks and adapter source hash. Performance was not measured again.

## Main line-mark merge

Main through `1ffe0c9d` is included. After rebuilding the updated config package and API declarations, the resulting app passes 110 tests, typecheck, lint and the production build on Node 24.14.0. PR #701 additionally checks 32 marked-code combinations against Chrome, with a worst difference of 0.1775% and no errors or fallback.

The first repeat of the UI probe after this merge completed its export actions but failed its page-error gate because a dynamic editor module failed to load during development-server startup. That run is retained separately and is not a pass.

At a running server, the repeat passes Inspector, Dock and Studio with one persisted and hydrated reload per layout, target picker and scale summaries, 1080×1080 PNGs, Restore defaults and the per-tab ZIP. Two actual WASM renders are observed, with no page errors or fallback. The earlier five-reload-per-layout result remains recorded separately.

## Following the UI signature merge

The integration now includes UI head `ad5b2bd0` (#729). The merge keeps tab marks, window surfaces and the current saved-signature schema together. 170 app tests, 71 API unit tests, app typecheck, lint and production build pass. The native 1x signature matrix was rerun against the actual merged frontend: all 18 combinations pass, with no page errors, fallback or font network issues. Avatar loading and signature CRUD runtime flows remain outside this image probe.
