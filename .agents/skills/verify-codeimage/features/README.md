# CodeImage feature map

| Feature | User entry points | Executable audit journey |
| --- | --- | --- |
| [Edit code](editor.md) | Guest `/`, `/classic`, saved project URL | Edit and undo on unified/classic |
| [Appearance](appearance.md) | Inspector Theme/Frame/Window/Code/Font | Theme commit, real PNG, accent wash |
| [Files](tabs.md) | Window tab strip | Add/name/switch/close, per-tab ZIP |
| [Exports](export.md) | Export, arrow menu, Settings → Export | PNG/SVG and Takumi selection/download |
| [Settings and commands](settings.md) | Settings, Cmd/Ctrl+K | Panel side, search reset, palette action |
| [Line marks and diff](line-marks.md) | Selection/keyboard, clipboard paste | Highlight/clear and diff import |
| [Signatures](signatures.md) | Frame → Signature, canvas signature | Save and reopen guest signature, PNG |
| [What’s new](whats-new.md) | Eligible first visit, Settings archive, feature dots | Archive → command menu |
| [Presets](presets.md) | Studio → Presets | Create, reload, apply guest preset |
| [Secrets](secrets.md) | Editor warning, image actions | Synthetic key → export review |
| [Projects](projects.md) | Sign in, Dashboard New/card, project URL | Mock login, autosave, reload/reopen |

Run `VERIFY_AUDIT=1 node .agents/skills/verify-codeimage/scripts/verify.mjs` from repository root. `audit.json` is the authoritative per-journey result; the table describes implemented coverage, not a guarantee every future run passes. The default helper still provides a quick editor-to-PNG smoke run.

Source paths in feature files are relative to `apps/codeimage/src/` unless explicitly rooted.

Every feature requires both source review and live evidence during maintenance. Each file distinguishes the executable journey from additional sub-features needing targeted proof. Do not claim complete matrix coverage from one convenient entry point.

Scope follows current checkout HEAD, including the November 14–15 unified editor, line marks, signatures, window styles, What's new and Takumi merges. `prototypes/editor-controls/` now implements the production guest `/` editor; its folder name is not a reason to exclude it. Authenticated `/` is Dashboard; saved project URLs still use classic Editor. Direct theme-card/prototype showcase routes are review tools. Animation core is present, but animation UI and CLI from separate branch histories are not reachable features at this HEAD.
