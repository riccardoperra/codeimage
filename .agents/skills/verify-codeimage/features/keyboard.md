# Keyboard menus in scrollable panels

`keyboard-scroll` opens menu and select triggers with Enter, Space, and ArrowDown. The matrix uses fresh contexts at 1440×900 and 390×844 for Inspector, Dock, and Studio. Each context sets `codeimage:editor-settings` before loading the editor. The legacy `inspector` and `studio` values exercise their migration to the accordion and rail sidebar preferences.

The journey creates a preset through the UI, visits the sidebar sections, and opens the Signature overlay. Dock visits each More group and the Font and phone Language panels. Dock has no Presets panel. Discovery includes enabled menu, listbox, and combobox triggers inside the active control panel or overlay with a CSS `auto` or `scroll` ancestor. Closed accordion sections and controls behind an overlay are excluded.

Discovery waits for finite panel transitions and reads the candidate list in one browser evaluation. Every discovered trigger receives focus before each key. The journey asserts that its popup appears, `aria-expanded` becomes true, the renderer completes another animation frame, and Escape closes the popup and restores focus. After the Signature sweep, another Escape closes Signature and returns focus to its opener. An explicit control list for each layout prevents missing controls from silently passing.

Sidebar coverage includes Preset menu, Padding, Saved signatures, Avatar source, Border, Shadow, Language, Theme, Font, and Font weight. Dock coverage includes Saved signatures, Avatar source, Border, Shadow, Syntax theme, and Font weight. The Signature fixture selects Card and Profile to reveal Avatar source. This produces 156 key openings across the six layout and viewport combinations. Native segmented controls, standalone listboxes, disabled controls, and triggers outside scrollable control panels are outside this case.

The watchdog runs in Node, outside the renderer. A key action that exceeds five seconds fails with its layout, viewport, scene, trigger, and key. CDP `Runtime.terminateExecution` interrupts a frozen renderer so the existing trace and context cleanup can finish. `keyboard-scroll.json` is written before and after each action, including failures. Per-layout screenshots and traces accompany the shared `audit.json`.

Run the case in an owned Chrome profile:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=keyboard-scroll VERIFY_BROWSER_CHANNEL=chrome VERIFY_PORT=4846 VERIFY_DEBUG_PORT=14846 ARTIFACT_DIR=/tmp/codeimage-keyboard-proof fnm exec --using=v24.14.0 node .agents/skills/verify-codeimage/scripts/verify.mjs
```

`shortcut-help` checks the trigger's 36 px desktop and 40 px phone hit areas. It opens the guide and checks desktop positioning and canvas geometry, phone modal behavior, Escape and the Close button, focus return, and ownership of the `?` key when typing in CodeMirror.

`rail-interrupted-close` closes Themes and immediately opens Frame on a 390 px Sidebar Rail. Frame must stay open after the Themes exit would have finished. The case repeats with reduced motion and verifies that closing Frame returns focus to its rail button.

`signatures` verifies nested dismissal. The first Escape closes Saved signatures and returns focus to its trigger. The second closes Signature and returns focus to its opener.
