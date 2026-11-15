# Replace legacy checks without losing coverage

Retire a script only after its assertions have a passing replacement. Keep reviewed fixtures beside their consuming checks. Store per-run screenshots and measurements outside the checkout.

| Existing script                                      | Replacement or reason to keep                                                                                                                                                                                        | Action                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `scripts/verify-mock-project-persistence.mjs`        | `projects` covers the mock GitHub sign-in, create, save, reload, reopen, rename, clone, delete, owner isolation, missing-resource responses and delayed MSW startup with restored IndexedDB                          | Retired after the expanded case passed. Use the command below                             |
| App `verify-snippets.mjs`                            | Six `snippet-*` audit cases cover unified loading and saves, previews, read-only layout and actions, banner Clone, missing/failed loads and local/snippet navigation in all three layouts at desktop and phone sizes | Retired after the replacement cases passed. See [saved projects](../features/projects.md) |
| `scripts/verify-p5-import-undo.cjs`                  | Multi-file import, full tab restoration, redo and history boundaries remain unique                                                                                                                                   | Keep until these assertions move to real clipboard and keyboard journeys                  |
| `scripts/verify-p5-focus.cjs`                        | Multiple focus ranges, clear chip geometry and hover lifetime, mobile chip, pixel dimming and undo remain unique                                                                                                     | Keep                                                                                      |
| `scripts/verify-p5-gutter.cjs`                       | Gutter menu, selection behavior, history and export geometry remain unique                                                                                                                                           | Keep                                                                                      |
| `scripts/verify-p5-layout.cjs`                       | Theme/window/line-number matrix checks geometry                                                                                                                                                                      | Keep as a specialist regression check                                                     |
| `scripts/verify-p5-exports.cjs`                      | Interleaved head/trunk export timing and CPU profiling                                                                                                                                                               | Keep as a benchmark, separate from functional smoke                                       |
| `scripts/parity/`                                    | Pixel comparisons across renderers, fonts, windows and marks                                                                                                                                                         | Keep                                                                                      |
| App `verify-locale-parity.mjs` and `verify-i18n.mjs` | Dictionary parity and all locales/layouts/viewports                                                                                                                                                                  | Keep                                                                                      |
| App `verify-review.mjs`                              | Every image entry point, focus and overlay geometry across layouts and viewports                                                                                                                                     | Keep                                                                                      |

The app scripts above live in `apps/codeimage/src/pages/UnifiedEditor/`. None of these commands is invoked by the current package scripts or GitHub workflows. Reusable commands from the retired reports are in [specialist checks](specialist-checks.md). The historical reports remain in Git history.

## Execution order

1. Extend the skill and run the replacement cases before deleting anything.
2. Retire a fully covered script in a separate change after its replacement passes. The project smoke is the first completed retirement.
3. Confirm no active caller still names the removed command. Re-run the replacement after deletion.
4. Transfer each remaining specialist behavior before proposing another removal. A basic PNG download cannot replace a pixel comparison, a geometry matrix or a benchmark.

The project journey drives dashboard CRUD through the UI. Supplemental HTTP assertions exercise existing mocked authorization and missing-resource boundaries. Its delayed-start fixture copies the disposable context's IndexedDB and mock-auth session into another disposable context. This fixture verifies MSW initialization; it is not evidence of real OAuth or PostgreSQL behavior.

Replacement command from repository root:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=projects node .agents/skills/verify-codeimage/scripts/verify.mjs
```
