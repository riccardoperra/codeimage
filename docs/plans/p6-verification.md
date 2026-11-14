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

## Independent review at the Opus commits

A second reviewer reran the checks on its own Playwright harness, against a trunk dev server and a head dev server, and changed the detector and the copy.

Fixed:

- `generic-assignment` backtracked catastrophically. A 10,000-character line of `token.` took 36 s and `token-` took 16 s, on the main thread, during linting. The name now starts only at the beginning of its run, and the keyword is checked with a lazy lookahead. The same line now takes under 1 ms. `connection-url-password` was quadratic on dotted runs (91 ms at 10,000 characters) and is now linear. A unit test covers four adversarial lines.
- Provider rules now keep the Gitleaks entropy minimums and the AWS `EXAMPLE` allowlist, so `ghp_xxxx…`, `sk_test_xxxx…`, and `AKIAIOSFODNN7EXAMPLE` get no hint.
- Connection passwords that contain `@` were cut at the first `@`, which left the rest visible. Placeholders such as `${DB_PASSWORD}`, `$DB_PASSWORD`, and `<password>` were flagged. Both are fixed.
- Generic assignments flagged prose (`passwordPlaceholder: "At least 8 characters, one symbol"`), URLs (`tokenEndpoint = "https://…/token"`), templates (`{{ csrf_token() }}`), and unquoted calls (`token = get_token_from_keychain()`). These are now skipped. A UUID or SHA assigned to a name like `sessionToken` still gets a hint on purpose.
- The copy read "Looks like a AWS access token", "Sembra un chiave privata", "Parece un clave API", and "1 possible secrets visible". The article now lives in each label, and a singular string handles one secret. The hint now says what redaction does and where undo works.

Reproduced at the Opus head:

| Check | Result |
| --- | --- |
| Lane 1 | Trunk and head clean PNG exports are byte-identical, 525 × 244, 0/128,100 changed pixels. No hint. |
| Lane 2 | The hint reads "Looks like a GitHub token". The dialog shows "1 possible secret visible" and **Export anyway**. After **Redact all**, the editor shows `ghp_` and 36 dots. The PNG is byte-identical to an export of the same bullets typed by hand. |
| Lane 3 | The redacted SVG (1.66 MB) contains `ghp_` and 36 bullets, with neither the token nor its suffix. |
| Lane 4 | Ignore hides the hint, nothing is written to storage, and the hint is back after reload. |
| Lane 5 | One Cmd+Z after Redact restores the token. |
| Lane 6 | The PEM block is one "Looks like a private key" diagnostic that spans all six lines. |
| Lane 9 | A UUID, a git SHA, and a lockfile `sha512-` integrity string get no hint and no export warning. |
| Lane 10 | The PUT sent after Redact contains bullets and no token. localStorage, sessionStorage, and every IndexedDB store hold no token. The reload view did not reproduce: `mocks/persist.ts` writes the mock DB only on BroadcastChannel messages and hydrates on a `load` event that has already fired, so the saved project returns 404 on reload. This is trunk mock behavior. |
| Two tabs | The warning counts "2 possible secrets visible". **Redact all** masks the inactive tab's connection password, and one Cmd+Z in the current tab restores its token. |

Detector perf, 5 warm-ups and 30 runs: `pnpm --filter=@codeimage/secrets bench` medians were 3.87, 4.32, and 2.62 ms (PR: 4.85 ms). On a mixed 2,000-line file (168,786 bytes, 572 matches) with `.env` lines, URLs, minified code, and lockfile hashes, the original detector had medians of 12.8 and 12.2 ms, and the fixed one 8.0 and 9.1 ms. Both are under the 20 ms limit. The host was loaded, so the maximums (80 to 287 ms) reflect contention.

The review video still shows the earlier copy. The warning screenshot is replaced, and [two-tab warning](media/p6-review-tabs-warning.png) is added.
