# Agent tools

Browser AI agents drive the editor through typed tools instead of clicks. The same six tools reach agents by two routes: WebMCP and Chrome DevTools MCP.

## Sub-features

`get_editor_state`, `list_themes`, `set_code`, `apply_theme`, `set_controls` and `export_image`. Invalid input returns `{ok: false, error}` and changes nothing; `set_controls` applies its valid entries and lists the rest under `errors`. Mutating tools refuse a read-only or loading snippet. `export_image` waits for the real outcome; with likely secrets in the code it exports nothing and opens the review dialog for the user. A clipboard export reports `started`, since the copy finishes in the background.

## How to get to it (agent POV)

**WebMCP.** On `/`, the page registers the tools with `document.modelContext` (or `navigator.modelContext` in older Chrome previews) while the editor is mounted. Without that API nothing is registered. An agent that supports WebMCP lists and calls them by name.

**Chrome DevTools MCP.** Start the server with third-party tools enabled, for example `npx chrome-devtools-mcp@latest --categoryExperimentalThirdParty=true`. Open the editor in the controlled Chrome. `list_3p_developer_tools` returns the `CodeImage` group with each tool's input schema. `execute_3p_developer_tool` runs one for that page; its `params` argument is JSON text. The page answers the `devtoolstooldiscovery` window event and installs no window global.

## Driving it with Playwright

`VERIFY_AUDIT=1 VERIFY_CASES=agent-tools node .agents/skills/verify-codeimage/scripts/verify.mjs`

The case runs in a fresh Inspector context whose init script installs a recording `document.modelContext`. It waits for all six tools, then calls their `execute` as an agent would. It asserts that `set_code` with `Python` changes the CodeMirror text and the language picker, and that an unknown language writes no code. `apply_theme` must select Dracula in the theme list, and an unknown theme must return suggestions and keep it. `set_controls` must change the live frame's computed padding, and an out-of-range `frame.opacity` must apply nothing. It downloads PNGs at 1x and 2x through `export_image` and checks the 2x size is twice the 1x size. It also checks that an invalid scale is rejected. Then it dispatches a synthetic `devtoolstooldiscovery` event with a `respondWith` spy and applies Night Owl through the received group. Evidence lands in `agent-1x.png`, `agent-2x.png` and `agent-tools-trace.zip`.

Source: `pages/UnifiedEditor/agent-tools/` (`tools.ts` is the registry, `adapters.ts` the WebMCP and DevTools adapters, `values.ts` the pure parsing with its unit tests) and `shell/export.tsx` for `ExportOutcome`.

## Gotchas

The recording `modelContext` stands in for a real agent. It proves registration, schemas and effects, not a vendor's agent UI. Real WebMCP agents and Chrome DevTools MCP need a manual run. Choice schemas carry an `enum` of option values fixed at registration, except `editor.theme` and `editor.formatter`, whose options change while the page runs. Their live values come from `get_editor_state`.
