# Replace legacy checks without losing coverage

Retire a script only after its assertions have a passing replacement. Keep historical screenshots and recorded measurements.

| Existing script | Replacement or reason to keep | Action |
| --- | --- | --- |
| `scripts/verify-mock-project-persistence.mjs` | `projects` covers real login, create, save, reload, reopen, rename, clone, delete, owner isolation, missing-resource responses and delayed MSW startup with restored IndexedDB | Remove in a separate cleanup change after the expanded case passes |
| `scripts/verify-p5-import-undo.cjs` | Multi-file import, full tab restoration, redo and history boundaries remain unique | Keep until these assertions move to real clipboard and keyboard journeys |
| `scripts/verify-p5-focus.cjs` | Multiple focus ranges, clear chip geometry and hover lifetime, mobile chip, pixel dimming and undo remain unique | Keep |
| `scripts/verify-p5-gutter.cjs` | Gutter menu, selection behavior, history and export geometry remain unique | Keep |
| `scripts/verify-p5-layout.cjs` | Theme/window/line-number matrix checks geometry | Keep as a specialist regression check |
| `scripts/verify-p5-exports.cjs` | Interleaved head/trunk export timing and CPU profiling | Keep as a benchmark, separate from functional smoke |
| `scripts/parity/` | Pixel comparisons across renderers, fonts, windows and marks | Keep |
| App `verify-locale-parity.mjs` and `verify-i18n.mjs` | Dictionary parity and all locales/layouts/viewports | Keep |
| App `verify-review.mjs` | Every image entry point, focus and overlay geometry across layouts and viewports | Keep |

The app scripts above live in `apps/codeimage/src/prototypes/editor-controls/`. None of these commands is invoked by the current package scripts or GitHub workflows. Historical evidence docs reference several commands and must remain intelligible after a retirement.

## Execution order

1. Extend the skill and run the replacement cases before deleting anything.
2. Retire only the fully covered project smoke script in a separate commit and PR based on the skill update.
3. Confirm no active caller still names the removed command. Re-run the replacement after deletion.
4. Transfer each remaining specialist behavior before proposing another removal. A basic PNG download cannot replace a pixel comparison, a geometry matrix or a benchmark.

The project journey drives dashboard CRUD through the UI. Supplemental HTTP assertions exercise existing mocked authorization and missing-resource boundaries. Its delayed-start fixture copies the disposable context's IndexedDB and mock-auth session into another disposable context. This fixture verifies MSW initialization; it is not evidence of real OAuth or PostgreSQL behavior.
