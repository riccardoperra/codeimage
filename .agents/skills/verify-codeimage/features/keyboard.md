# Keyboard menus in scrollable panels

`keyboard-scroll` opens menu and select triggers with Enter, Space, and ArrowDown. The matrix uses fresh contexts at 1440×900 and 390×844 for Inspector, Dock, and Studio. Each context sets `codeimage:editor-settings` before loading the editor. The legacy `inspector` and `studio` values exercise their migration to the accordion and rail sidebar preferences.

The journey creates a preset through the UI, visits the sidebar sections, and opens the Signature overlay. Dock visits each More group and the Font and phone Language panels. Dock has no Presets panel. Discovery includes enabled menu, listbox, and combobox triggers inside the active control panel or overlay with a CSS `auto` or `scroll` ancestor. Closed accordion sections and controls behind an overlay are excluded. A CSS scroll container matters even when its contents currently fit, because Kobalte checks overflow styles rather than scroll dimensions.

Discovery waits for finite panel transitions and reads the candidate list in one browser evaluation. Every discovered trigger receives focus before each key. The journey asserts that its popup appears, `aria-expanded` becomes true, the renderer completes another animation frame, and Escape closes the popup and restores focus. An explicit control list for each layout prevents missing controls from silently passing.

Sidebar coverage includes Preset menu, Padding, Saved signatures, Avatar source, Border, Shadow, Language, Theme, Font, and Font weight. Dock coverage includes Saved signatures, Avatar source, Border, Shadow, Syntax theme, and Font weight. The Signature fixture selects Card and Profile to reveal Avatar source. This produces 156 key openings across the six layout and viewport combinations. Native segmented controls, standalone listboxes, disabled controls, and triggers outside scrollable control panels are outside this case.

The watchdog runs in Node, outside the renderer. A key action that exceeds five seconds fails with its layout, viewport, scene, trigger, and key. CDP `Runtime.terminateExecution` interrupts a frozen renderer so the existing trace and context cleanup can finish. `keyboard-scroll.json` is written before and after each action, including failures. Per-layout screenshots and traces accompany the shared `audit.json`.

Run the case in an owned Chrome profile:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=keyboard-scroll VERIFY_BROWSER_CHANNEL=chrome VERIFY_PORT=4846 VERIFY_DEBUG_PORT=14846 ARTIFACT_DIR=/tmp/codeimage-keyboard-proof fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

`shortcut-help` opens the keyboard shortcuts guide on desktop and phone. It checks desktop positioning and canvas geometry, phone modal behavior, Escape and the Close button, focus return, and ownership of the `?` key when typing in CodeMirror.

The dependency patch is `patches/@kobalte__utils@0.9.1.patch`. Both ESM and CommonJS bundles start each `scrollIntoViewport` lookup at the target's parent. Each iteration therefore reaches a strict ancestor and eventually the document root. The exported `getScrollParent` behavior remains unchanged. The editor's root overflow and the Animate trigger placement workaround remain unchanged.

`scripts/keyboard-scroll.test.mjs` runs the installed ESM utility against a hidden document root and nested CSS scroll containers. A visit limit fails the original loop without hanging the test process. The test also checks that `getScrollParent` keeps its exported behavior and that scrollable targets and detached elements terminate. `VERIFY_KOBALTE_UTILS` can point to the original package's `dist/index.cjs` to repeat the negative control; the test imports its adjacent ESM bundle.

Installed Kobalte versions are core 0.13.11 and utils 0.9.1. The app, UI package, and kit share that utils resolution. On November 16, 2026, published utils 0.9.2 still contains the loop; core 0.13.14 depends on utils ^0.9.2. Their changelogs contain no fix for this loop. [Upstream PR 750](https://github.com/kobaltedev/kobalte/pull/750) proposes the same parent traversal and remains open. Recheck published source before removing the patch or updating Kobalte.
