# Local AI

A request in plain words, such as "add a tab with this code `…`, use Dracula, padding 32, export PNG 2x", becomes editor changes. Chrome's on-device model (Prompt API, Gemini Nano) plans the change, and the page runs the plan through the same tools that browser agents call. Nothing leaves the browser and there is no cloud fallback.

## Sub-features

The experiment switch, the command, the dialog with its request field, Run, download progress, and one row per step with its tool and `Done` or the tool's error. Fenced code blocks never reach the model: the page swaps them for `CODE_1`, `CODE_2` and puts the code back when a step names one. The model answers with `{steps: [{tool, args}]}` under a JSON Schema `responseConstraint` that lists only the tools that act. The plan stops at the first step that fails. A new session opens for each request, with a system prompt that lists the tools, every theme name, the featured languages, the tabs and each setting with its valid values.

## How to get to it (user POV)

Only in a browser that exposes `LanguageModel` and does not answer `unavailable`. Settings → Experiments → Local AI → Use local AI. Then the command menu (Cmd/Ctrl+K) offers Ask local AI…, on an editable snippet only. When the model is `downloadable`, the first Run downloads it and the dialog shows a progress bar.

## Driving it with Playwright

`VERIFY_AUDIT=1 VERIFY_CASES=local-ai node .agents/skills/verify-codeimage/scripts/verify.mjs`

The case runs in a fresh Inspector context whose init script installs a fake `LanguageModel`. It starts `downloadable`, reports download progress through `monitor`, records the system prompt and each prompt, and answers two canned requests with canned plans. The case checks that the command is absent before the experiment, turns the switch on in Settings → Experiments, opens the command from the menu and types the request with a fenced Python block. Run must show the download progress, then four `Done` rows: `add_tab` with `CODE_1`, `apply_theme`, `set_controls` with `frame.padding` 32 and `export_image` PNG at 2x. It asserts that the prompt carries `CODE_1` and the fence hint but not the code, that the schema enum excludes `get_editor_state`, and that the system prompt stays under 12,000 characters. After the dialog closes, CodeMirror must show the code, the window `hello.py`, the theme list Dracula and the frame a new padding. The downloaded PNG must be the live frame at 2x. A second request whose plan applies an unknown theme must leave one failed row and download nothing. Evidence lands in `local-ai-2x.png`, `local-ai-dialog.png` and `local-ai-trace.zip`.

Source: `pages/UnifiedEditor/local-ai/` (`plan.ts` holds the code-block extraction, plan schema, plan parsing, `runPlan` and the prompts, with unit tests; `language-model.ts` the Prompt API boundary; `LocalAi.tsx` the dialog), `shell/preferences.ts` for the `localAi` experiment and `agent-tools/tools.ts` for the tools.

## Gotchas

The fake model proves the wiring, the prompt contents and the effects, not the quality of Gemini Nano's plans. A real run needs Chrome with the on-device model available, which a fresh Playwright profile reports as `unavailable`. The audit measured a 3,078-character system prompt for the default editor; keep it well under the model's input quota when adding tools or settings. The model may still name a theme or value the tools reject: the failing step's row shows the tool's error.
