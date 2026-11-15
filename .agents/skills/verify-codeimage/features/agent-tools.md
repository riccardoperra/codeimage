# Agent tools

Browser AI agents drive the editor through typed tools instead of clicks. The same eight tools reach agents by two routes: WebMCP and Chrome DevTools MCP.

## Sub-features

`get_editor_state`, `list_themes`, `set_code`, `add_tab`, `select_tab`, `apply_theme`, `set_controls` and `export_image`. `get_editor_state` lists the tabs as `{index, name, language, active}`. `add_tab` makes the new tab active and refuses a seventh tab; `select_tab` takes a 0-based `index` or a `name` and lists the tabs when neither matches. Invalid input returns `{ok: false, error}` and changes nothing; `set_controls` applies its valid entries and lists the rest under `errors`. Mutating tools refuse a read-only or loading snippet. `export_image` waits for the real outcome; with likely secrets in the code it exports nothing and opens the review dialog for the user. A clipboard export reports `started`, since the copy finishes in the background.

The person watching sees each call in a floating card at the bottom left, above the What's new Nudge: the localized title, the raw tool name, a short summary of the arguments (never the code, only its line count), and a spinner, check or cross. A failed call shows its error. `withActivity` in `activity.ts` records the calls for the WebMCP, DevTools and Local AI routes; `ToolActivity.tsx` draws them.

## How to get to it (agent POV)

**WebMCP.** On `/`, the page registers the tools with `document.modelContext` (or `navigator.modelContext` in older Chrome previews) while the editor is mounted. Without that API nothing is registered. An agent that supports WebMCP lists and calls them by name.

**Chrome DevTools MCP.** Start the server with third-party tools enabled, for example `npx chrome-devtools-mcp@latest --categoryExperimentalThirdParty=true`. Open the editor in the controlled Chrome. `list_3p_developer_tools` returns the `CodeImage` group with each tool's input schema. `execute_3p_developer_tool` runs one for that page; its `params` argument is JSON text. The page answers the `devtoolstooldiscovery` window event and installs no window global.

## Driving it with Playwright

`VERIFY_AUDIT=1 VERIFY_CASES=agent-tools node .agents/skills/verify-codeimage/scripts/verify.mjs`

The case runs in a fresh Inspector context whose init script installs a recording `document.modelContext`. It waits for all eight tools, then calls their `execute` as an agent would. It asserts that `set_code` with `Python` changes the CodeMirror text and the language picker, and that an unknown language writes no code. `apply_theme` must select Dracula in the theme list, and an unknown theme must return suggestions and keep it. `set_controls` must change the live frame's computed padding, and an out-of-range `frame.opacity` must apply nothing. It downloads PNGs at 1x and 2x through `export_image` and checks the 2x size is twice the 1x size. It also checks that an invalid scale is rejected. Then it dispatches a synthetic `devtoolstooldiscovery` event with a `respondWith` spy and applies Night Owl through the received group. Last, `add_tab` with code, `Python` and `main.py` must show the new code in CodeMirror; an unknown language adds no tab; `select_tab` by index and by name (ignoring case) must switch the CodeMirror text; an unknown name lists the tabs; and the seventh `add_tab` must fail with the limit. Then it checks the activity card. After the earlier calls' card has hidden, it starts a PNG export and sees its row `running`, then runs `set_code`, `apply_theme`, `set_controls`, a failing `apply_theme` and `list_themes`. The calls from before the card hid must come back above them, and the last six rows must show each raw tool name, status, summary (`PNG · 2x · download`, `TypeScript · 2 lines`, `padding N`) and the failure's error, with `list_themes` marked read-only. The code text must never appear in the card, and the chip must read `WebMCP`. Hovering keeps the card open past 5 s, and it hides about 10 s after the pointer leaves. Hiding keeps the calls: the next call brings the card back with them, and only Dismiss clears them. At 390px a DevTools call shows the card 16px from each side with a `DevTools MCP` chip and the earlier calls still listed, and Dismiss removes it. Last, with `?whatsNew=nudge`, the card must sit above the Nudge. Evidence lands in `agent-1x.png`, `agent-2x.png`, `agent-activity.png`, `agent-activity-phone.png`, `agent-activity-nudge.png` and `agent-tools-trace.zip`.

Source: `pages/UnifiedEditor/agent-tools/` (`tools.ts` is the registry, `adapters.ts` the WebMCP and DevTools adapters, `values.ts` the pure parsing with its unit tests, `activity.ts` the call log and summaries with their unit tests, `ToolActivity.tsx` the card) and `shell/export.tsx` for `ExportOutcome`.

## Gotchas

The recording `modelContext` stands in for a real agent. It proves registration, schemas and effects, not a vendor's agent UI. Real WebMCP agents and Chrome DevTools MCP need a manual run. Choice schemas carry an `enum` of option values fixed at registration, except `editor.theme` and `editor.formatter`, whose options change while the page runs. Their live values come from `get_editor_state`.
