# P6 verification

The web and shared-package work branches from main (`27b185f1`). CLI lanes 7 and 8, including `--no-redact`, are deferred until P4.

## Checks

- `pnpm install --frozen-lockfile` and `pnpm libs:build`: passed.
- `pnpm --filter=@codeimage/secrets test`: 31 passed, covering every rule, near misses, placeholders, entropy boundaries, and redaction behavior.
- `pnpm lint`: passed, with 33 existing app warnings and no errors.
- `pnpm typecheck`: passed across the workspace.
- `git diff --check`: passed.

The final performance probe scans 2,000 lines (145,551 bytes), with 20 fake GitHub PATs. Five warm-ups precede 30 measured runs. Every measured run asserts 20 `github-pat` matches. Median: **4.85 ms**, range **2.18–542.71 ms** on a heavily contended host. The median passes the 20 ms gate; this is a detector scan measurement, not end-to-end typing latency.

## Browser lanes

Playwright used the cached Chromium 1200 binary at a 1440 × 1000 viewport. All input credentials were obviously fake fixtures.

| Lane | Result |
| --- | --- |
| 1 | Clean export has no hints; main and head PNGs are byte-identical, 525 × 244, 0/128,100 changed pixels. |
| 2 | Export warning appears; Redact all preserves `ghp_` and replaces the 36-character suffix with bullets in the editor and PNG. |
| 3 | Redacted SVG contains bullets and no original token. |
| 4 | Ignore hides the hint; reload restores it. |
| 5 | Redact followed by Cmd+Z restores the original token. |
| 6 | The PEM block is detected as one private-key match. |
| 7–8 | Deferred CLI work. |
| 9 | Bare UUID and git SHA produce no hint. |
| 10 | After redaction and saved-project reload, the original token is absent from every IndexedDB store and the captured PUT payload sent by the app to the mock API. |

Additional checks pass for an inactive tab containing a secret, ignored hints still triggering the export warning, Redact all across two tabs, and Export anyway preserving the original token in SVG.

## Test setup

The local server runs on port 4406 with mock auth and MSW enabled. API generated types were built locally before workspace typechecking. The environment file remains ignored.

Main comparison used the same installed dependencies and a separate Vite cache on port 4416. A temporary Vite loader served the four changed application modules directly from `git show 27b185f1:<path>`; all other application code was already identical to main. The restored preview editor is also identical to main. The failed scratch-archive startup attempts were discarded.

The checked-in worker is MSW 0.47 while the installed client is 2.12.14. A temporary dev-server middleware served the installed worker for testing; `public/mockServiceWorker.js` is unchanged in this PR. The harness maps the existing Inter font URLs to installed font files and marks the existing changelog as seen. The mock database hydrates asynchronously on `load`; the reload lane waits for its existing hydration before issuing the project GET. It neither alters the captured PUT payload nor injects persisted project data. Transient Vite module-fetch/worker-update errors during startup were recorded in the local logs; assertions run after the UI is ready.

## Review evidence

- [Export warning](media/p6-review-warning.png)
- [Redacted editor](media/p6-review-redact.png) and [exported PNG](media/p6-review-export.png)
- [SVG lane](media/p6-review-svg.png)
- [Reloaded saved project](media/p6-review-persist.png)
- [Video](media/p6-review.mp4)
- [Metrics and captured persistence data](media/p6-review-evidence.json)

Raw screenshots, scripts, logs, PNG comparison, SVG exports, and the decision trail are in `/tmp/swarm-p6/` on the implementation machine.

The coordinator review was applied: no preview-editor change, no worker-file change, and an explicit store-owned editor view passed to Redact all. Independent review of the final PR head remains with the coordinator.
