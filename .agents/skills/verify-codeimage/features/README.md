# CodeImage feature map

| Feature                              | User entry points                                    | Executable audit journey                                                                                                    |
| ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [Edit code](editor.md)               | Guest `/`, `/classic`, saved project URL             | Edit/undo and `editor-options`; `frame-cold-start` checks first-paint geometry and lazy tab labels                          |
| [Appearance](appearance.md)          | Inspector Theme/Frame/Window/Code/Font               | Theme commit, real PNG, accent wash                                                                                         |
| [Files](tabs.md)                     | Window tab strip                                     | Add/name/switch/close, per-tab ZIP                                                                                          |
| [Exports](export.md)                 | Export, arrow menu, Settings → Export                | PNG/SVG and Takumi; `export-options` checks formats/scale/alt text; `export-screen-parity` compares PNG with the live frame |
| [Settings and commands](settings.md) | Settings, Cmd/Ctrl+K, `?` shortcut help              | Panel side, search reset, palette; `settings-persistence` checks Dock/Orb reload, defaults and empty search                 |
| [Line marks and diff](line-marks.md) | Selection/keyboard, clipboard paste                  | Highlight/clear and diff import; `annotations` checks real annotated paste and focus                                        |
| [Signatures](signatures.md)          | Frame → Signature, canvas signature                  | Save/reopen and PNG; `signature-management` checks style, rename and delete                                                 |
| [What’s new](whats-new.md)           | Eligible first visit, Settings archive, feature dots | Archive → command menu                                                                                                      |
| [Presets](presets.md)                | Studio → Presets                                     | Create/reload/apply; `preset-management` checks rename and persistent delete                                                |
| [Secrets](secrets.md)                | Editor warning, image actions                        | Synthetic key review/cancel, Redact all and real download                                                                   |
| [Agent tools](agent-tools.md)        | WebMCP agents, Chrome DevTools MCP                   | `agent-tools` drives code, theme, settings and a 1x/2x PNG export through the tools                                         |
| [Local AI](local-ai.md)              | Settings → Experiments, Cmd/Ctrl+K                   | `local-ai` runs a canned plan from a fake Prompt API: new tab, theme, padding and a 2x PNG                                  |
| [Projects](projects.md)              | Sign in, Dashboard New/card, project URL             | Dashboard CRUD and persistence; six snippet cases cover loading, previews, ownership, Clone, failures and navigation        |

Run `VERIFY_AUDIT=1 node .agents/skills/verify-codeimage/scripts/verify.mjs` from repository root. `audit.json` is the authoritative per-journey result; the table describes implemented coverage, not a guarantee every future run passes. The default helper still provides a quick editor-to-PNG smoke run.

Source paths in feature files are relative to `apps/codeimage/src/` unless explicitly rooted.

Every feature requires both source review and live evidence during maintenance. Each file distinguishes the executable journey from additional sub-features needing targeted proof. Do not claim complete matrix coverage from one convenient entry point.

Scope follows current checkout HEAD, including the November 14–15 unified editor, line marks, signatures, window styles, What's new and Takumi merges. `pages/UnifiedEditor/` now implements the production guest `/` editor; its folder name is not a reason to exclude it. Authenticated `/` is Dashboard; saved project URLs use the unified editor in the saved layout. The theme-card and editor-controls prototype routes are gone. Animation core is present, but animation UI and CLI from separate branch histories are not reachable features at this HEAD.

Additional case names are `agent-tools`, `local-ai`, `export-options`, `settings-persistence`, `annotations`, `signature-management`, `editor-options`, and `preset-management`. The six snippet cases are `snippet-save`, `snippet-previews`, `snippet-read-only`, `snippet-clone`, `snippet-missing`, and `snippet-navigation`. Including the watermark, `frame-cold-start` and `export-screen-parity` journeys, there are twenty-eight selectable journeys. The two frame cases use the same owned launch and fresh-context helpers. Source paths are unchanged by the check migration. Read [the legacy-check retirement plan](../references/legacy-checks.md) before deleting old scripts.

For real API and PostgreSQL prerequisites, read [backend modes](../references/backend-modes.md). The automated MSW-specific boundary fixtures cannot establish real API authorization.
