# UI audit of the CodeImage editor

Audit date 2026-11-14. Branch `t3/codebase-ui-modernization`. App driven at `http://localhost:4311/` with Playwright 1.65.1 (Chromium, headless). Read-only on source.

**Goal.** Riccardo wants to modernize the CodeImage editor unless it is already modern. He named three pains: the space is small, there are many options, and theme selection could be better. This report measures those three pains and feeds three layout prototypes.

**Historical design record.** This audit describes the classic editor before the unified redesign. Its measurements and UX findings are historical, not a current verification result. The original screenshots and run reports are recoverable from Git history. For the current design, read the [editor source guide](../../apps/codeimage/src/prototypes/editor-controls/README.md). Use the [verification skill](../../.agents/skills/verify-codeimage/SKILL.md) for current checks.

**Labels.** "Measured" means a script read the value from the running page. "Inferred" means I derived it from measured values or from code. "Guess" means neither.

---

## 1. Verdict

1. The visual style is not dated. Tokens, type (Inter), dark and light themes, rounded canvas and focus rings are consistent in every screenshot I took (`1440-dark-editor.png`, `1440-light-editor.png`).
2. The layout model is dated. Two fixed 280px sidebars take 560px at every desktop width, and one of them exists only to show three theme cards at a time.
3. The real problem is space allocation. The canvas gets 872px of 1440 and 456px of 1024 (measured). The default frame is 593px wide, so it is already clipped at 1024 (`1024-dark-editor.png`).
4. Theme selection is the weakest picker. 3 of 26 themes fit in a 1440x900 window, and reaching the last one takes 50 wheel notches (measured). On a 390px phone 1 theme fits and there is no search.
5. The option list is long because of control choice, not option count. 8 of 21 options are booleans, and each one takes a 144px two-segment control and a 38px row.
6. The responsive behaviour is broken, not just cramped. The layout is chosen once at load, the preview does not scale on desktop, and the phone preview loads cut off (`390-dark-editor.png`).
7. Four pickers and all 26 theme cards cannot be used with a keyboard (measured in `keyboard2.mjs`).
8. Motion is restrained in amount but wrong in detail. Easing is `ease-in-out`, popovers ignore their trigger, and nothing honours reduced motion.
9. Ray.so and chalk.ist both solve the same job with one control area, switches for booleans and a compact searchable theme list (checked today, section 9).
10. A redesign of the controls is justified. A repaint is not needed.

---

## 2. Density measurements

All numbers measured on the running app unless marked.

| Measure                                                         | Value                                                                                                                                       | How                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Options in the left sidebar                                     | 21 (20 shown by default, "Line start" appears when line numbers are on)                                                                     | Counted in `FrameStyleForm.tsx`, `WindowStyleForm.tsx`, `EditorStyleForm.tsx` and in the DOM                  |
| Options per section                                             | Frame 6, Window 7, Editor 5, Font 3                                                                                                         | Same                                                                                                          |
| Options by control type                                         | Segmented control 8, select 7, popover picker 4, range slider 1, number field 1                                                             | Same                                                                                                          |
| Segmented controls that are plain booleans                      | 7 of 8. Only Radius has more than two values                                                                                                | `value` is `true`/`false` in the forms                                                                        |
| Yes/No and Show/Hide segmented controls that are plain booleans | 6 of 6 (Visible, Header, Ligatures use Yes/No. Reflection, Watermark, Line number use Show/Hide)                                            | Same                                                                                                          |
| Booleans in total                                               | 8 of 21, 38%. The seventh is Window background (Default/Alternative). The eighth is the Border select, which has two values, None and Glass | `WindowStyleForm.tsx:32-36`, `:57-60`                                                                         |
| Other settings outside the sidebar                              | Tab accent checkbox inside the Window popover. File type, scale and "only active tab" in the export popover and again in the export dialog  | `1440-dark-popover-window-picker.png`, `1440-dark-export-settings-popover.png`, `1440-dark-export-dialog.png` |
| Row pitch and control size                                      | Row 38px. Label column 88px. Control column 150px. Select and picker triggers 30px tall. Segments 24px tall                                 | `discover.mjs`                                                                                                |
| Left sidebar height against the window                          | Content 1091px in an 848px viewport at 1440x900. 243px (22%) is below the fold                                                              | `recon.mjs`                                                                                                   |
| Option rows that fit without scrolling                          | 15 of 20 at 1440x900. 13 of 20 at 1024x768 (inferred from row positions)                                                                    | `recon.mjs`                                                                                                   |
| Scroll steps to the last option (Ligatures)                     | 3 wheel notches of 100px at 1440x900. 4 at 1024x768 (inferred from 243px and 375px overflow)                                                | `recon.mjs`, `themes.mjs`                                                                                     |
| Themes                                                          | 26                                                                                                                                          | `themes.mjs`                                                                                                  |
| Theme card size                                                 | 230x189px with a 32px gap, 221px pitch                                                                                                      | `themes.mjs`                                                                                                  |
| Themes that fit at 1440x900                                     | 3 whole cards, a fourth partly. 11.5% of the list                                                                                           | `themes.mjs`                                                                                                  |
| Themes that fit at 1024x768                                     | 2 whole cards                                                                                                                               | `themes.mjs`                                                                                                  |
| Theme list length at 1440x900                                   | 5803px in an 848px viewport, 6.8 screens                                                                                                    | `themes.mjs`                                                                                                  |
| Scroll steps to the last theme at 1440x900                      | 50 wheel notches of 100px, then 1 click                                                                                                     | `themes.mjs`                                                                                                  |
| Themes that fit at 390x844                                      | 1 whole card and a sliver of the second                                                                                                     | `responsive.mjs`, `390-dark-tab-themes.png`                                                                   |
| Steps to the last theme at 390x844                              | 1 tap to open the tab, then 25 swipes. The strip is 8278px wide with mandatory snap and a 318px pitch (25 is inferred)                      | `responsive.mjs`                                                                                              |
| Theme search                                                    | Desktop only. Needs 3 characters. No search on phones                                                                                       | `useFilteredThemes.tsx:12`, `ThemeSwitcher.tsx:60`                                                            |
| Steps to the last option at 390x844                             | Styles tab holds 13 options in 636px of content inside a 422px sheet, so 1 tap and 1 swipe. Editor tab holds 7 options and fits             | `responsive.mjs`                                                                                              |
| Canvas width                                                    | 872px of 1440 (61%). 456px of 1024 (45%). 232px of 800 (29%)                                                                                | `responsive.mjs`                                                                                              |
| Smallest window where the default frame fits                    | About 1160px wide (inferred from 593px frame plus 560px sidebars plus 8px padding)                                                          | `responsive.mjs`                                                                                              |
| Preview left visible under the phone Styles sheet               | About 83px of frame. The sheet is 465px of a 740px canvas                                                                                   | `390-dark-tab-styles.png`                                                                                     |
| Smallest touch target in the phone sheets                       | 24px tall (segments). Selects and the close button are 30px                                                                                 | `responsive.mjs`                                                                                              |
| Tab stops                                                       | Toolbar 3, left sidebar 20, hidden presets panel 3, theme list 1 (the search field)                                                         | `keyboard.mjs`                                                                                                |

---

## 3. Findings

Severity. P0 blocks the main task for a class of users or widths. P1 is a major cost on the main task. P2 is a clear defect off the main path. P3 is polish. Effort is S (hours), M (days), L (a week or more).

### UX-01. The preview does not fit its canvas below about 1160px, and loads cut off on phones. P0

- **Evidence.** `1024-dark-editor.png`, `800-dark-editor.png`, `390-dark-editor.png`, `break-320-editor.png`. Canvas 456px against a 593px frame at 1024 (measured). On a 390px phone the frame box is x 121 to 471, so 81px hang off the right edge (measured). `components/Frame/FrameHandler.tsx:28-37` computes the scale once, on mount, and only on mobile. Line 46 applies no scale on desktop. `components/Scaffold/Scaffold.css.ts:5` fixes `panelWidth` at 280px.
- **What the user feels.** The thing they are designing is cut in half on a 13 inch laptop with a split window. They scroll sideways inside the canvas to see their own code.
- **Fix.** Add zoom to fit on desktop with a visible zoom control and a 100% reset. Recompute scale on resize and when content changes. Give the canvas a guaranteed minimum share by collapsing panels before the canvas shrinks.
- **Effort.** M.

### UX-02. The theme picker shows 3 of 26 themes and has no fast path. P1

- **Evidence.** `1440-dark-editor.png`, `1440-dark-themes-mid.png`, `1440-dark-themes-bottom.png`, `390-dark-tab-themes.png`, `390-dark-tab-themes-end.png`. Numbers in section 2. `components/ThemeSwitcher/ThemeSwitcher.css.ts:13` sets a 32px gap and `:27` a single column. `:21` makes phone cards 80% of the width.
- **What the user feels.** Choosing a look is a long scroll through near identical code samples. They cannot compare two themes that are five cards apart. On a phone they give up after a few swipes.
- **Fix.** A grid of small tiles (background, a two line code sketch, name) so all 26 fit in one screen at 1440x900. Today's card cannot simply be shrunk. Two columns of the current card make each one 136x281px and show 4 (measured with injected CSS, `quickwin-theme-grid-2col-injected-css.png`). Search on every width. Arrow keys move through tiles and preview on the canvas at once. Filter chips for dark and light. The Theme select in the Editor section then becomes redundant and can go.
- **Effort.** M.

### UX-03. 560px of fixed panels hold 21 options in one flat list. P1

- **Evidence.** `crop-en-sidebar-full.png`, `1440-dark-sidebar-bottom.png`. Section 2 numbers. `components/PropertyEditor/EditorSidebar.css.ts:40` gives every row a three column grid and `:76` a 30px label. `components/PropertyEditor/EditorSidebar.tsx:7-24` renders all four sections open with no collapse.
- **What the user feels.** "Very many options", as Riccardo said. The count is moderate. The list feels long because a yes or no costs the same space as a language picker, and nothing can be folded away.
- **Fix.** Booleans become switches on the label row. Sections collapse and remember their state. Rare options (Aspect ratio, Border, Formatter, Ligatures, Line start) sit one level deeper. One panel, not two.
- **Effort.** M.

### UX-04. The phone sheet hides the preview and has no dismissal gesture. P1

- **Evidence.** `390-dark-tab-styles.png`, `390-dark-tab-editor.png`, `break-zoom200-tab-styles.png`. The sheet stays open after Escape and after a tap outside (measured, `responsive.mjs`). `components/BottomBar/BottomBar.tsx:61-97` mounts it with a plain `Show`. `components/BottomBar/BottomBar.css.ts:45` caps content at `50vh`. The only exit is a 30px close button at `BottomBar.tsx:65-73`.
- **What the user feels.** They change padding and cannot see the padding change. They close the sheet to look, then open it again.
- **Fix.** A sheet with two stops (a short strip of the most used controls, and half height), drag to dismiss, tap outside to close, and a preview that scales to the space left above the sheet.
- **Effort.** M.

### UX-05. Four pickers and all theme cards are mouse only. P1

- **Evidence.** `kbd-color-popover-enter.png` shows nothing opened. Enter and Space on the Background, Aspect ratio, Window style and Font triggers open nothing (measured, `keyboard2.mjs`). The triggers are `div role="button"` rendered through `components/PropertyEditor/SidebarPopover/SidebarPopover.tsx:25`. Theme cards are `div` with `onClick` and no role or tabindex at `components/ThemeSwitcher/ThemeBox.tsx:19-26`. Tab after the theme search leaves the page (measured). The closed presets panel is still in the tab order with 3 stops (`keyboard.mjs`, `pages/Editor/components/LeftSidebar.tsx:36-61`).
- **What the user feels.** A keyboard user can change padding but not the background, the font or the theme. Focus disappears into an invisible panel for three presses.
- **Fix.** Use real `button` triggers. Make the theme list a listbox or radio group with roving focus. Take the closed presets panel out of the tab order with `inert` or by unmounting it.
- **Effort.** S for triggers and presets. M for the theme list.

### UX-06. No theme is marked as selected on first load, and the Theme select is blank. P1

- **Evidence.** `1440-dark-editor.png` (no outlined card, empty Theme field). Zero cards carry `data-selected="true"` on load (measured, `light.mjs`). `state/editor/editor.ts:35` defaults to `themeId: 'fleetTheme'`. The theme is registered as `id: 'fleetDark'` at `packages/highlight/src/lib/themes/fleetDark/index.ts:5`. After picking a theme by hand the selection shows correctly (measured, `break2.mjs`).
- **What the user feels.** The picker looks broken before they touch it. They cannot tell which theme the preview is using.
- **Fix.** Change the default id to `fleetDark`. Fall back to the first theme when a stored id is unknown.
- **Effort.** S.

### UX-07. The layout is chosen once at load and never again. P1

- **Evidence.** `break-resize-1440-to-600-no-reload.png` (canvas gone, sidebar fills the window). `break-resize-390-to-1440-no-reload.png` (empty phone layout on a desktop window). `break-zoom200-editor.png` (200% zoom on a 1440 laptop gives the phone layout). `core/hooks/isMobile.tsx:5` reads `matchMedia(...).matches` once and is not reactive. The CSS at `pages/Editor/App.css.ts:13` does react, so the two disagree after a resize.
- **What the user feels.** They drag the window narrower to sit next to their editor and the preview vanishes.
- **Fix.** Make the breakpoint a reactive signal. Better, drive panel collapse from container width so a narrow desktop window gets a collapsed panel and not the phone layout.
- **Effort.** S for the signal. M for container driven collapse.

### UX-08. Popovers and select lists cover the preview and use a different scale from the sidebar. P2

- **Evidence.** `1440-dark-popover-color-picker.png`, `1440-dark-popover-aspect-ratio.png`, `1440-dark-popover-font-picker-tab0.png`, `1440-dark-select-frameLanguageField.png`. Popovers are 360px wide and open to the right, over the frame (`components/PropertyEditor/SidebarPopover/SidebarPopover.tsx:20`, `SidebarPopover.css.ts:7`). Select options are 42px tall with 16px text. Triggers are 30px with 12.8px text (measured). The language list has 31 options and no search field.
- **What the user feels.** They pick a background colour and the picker sits on top of the background. Lists feel like they belong to another app.
- **Fix.** Open pickers inside the panel (inline expansion) or on the side away from the frame. List rows at 28 to 30px and 13px text. A filter field for Language and Font.
- **Effort.** M.

### UX-09. Export settings live in two places with two different scale values. P2

- **Evidence.** `1440-dark-export-settings-popover.png` shows chips 1x, 2x, 3x, 6x with 3x active and an output size. `1440-dark-export-dialog.png` shows a slider at 2x and no output size. The dialog keeps its own signal at `components/Toolbar/ExportButton.tsx:137-138`. The popover writes the store at `components/Toolbar/ExportContent.tsx:94-96`. The popover's trigger is named "hint" for screen readers (`components/Toolbar/ExportSettingsButton.tsx:11`), and its last label is clipped ("(Export) Show only active t").
- **What the user feels.** They set 3x, press Export, and the dialog says 2x. They do not know which one wins.
- **Fix.** One export model. The dialog and the popover read and write the same store. Show the output size in both. Name the button "Export settings".
- **Effort.** S.

### UX-10. Labels do not point at their controls, and toggles announce as tabs. P2

- **Evidence.** 11 of 20 labels have a `for` id that does not exist. 3 point at the wrong control. 6 are correct (measured, `recon.mjs`). Theme points at Language (`components/PropertyEditor/EditorStyleForm.tsx:140`). Ligatures points at Font weight (`:302`). Border points at Shadow (`components/PropertyEditor/WindowStyleForm.tsx:172`). Segmented controls render `role="tablist"` and `role="tab"` (`discover.mjs`). Arrow keys move focus but need Enter to commit (measured).
- **What the user feels.** Clicking a label does nothing. A screen reader user hears "tab, Yes" for a setting. A keyboard user needs two keys to flip a boolean.
- **Fix.** Derive the id inside `PanelRow` so label and control cannot drift. Switches for booleans (`role="switch"`). Radio group for Radius.
- **Effort.** S.

### UX-11. Four vocabularies for the same on/off choice. P2

- **Evidence.** `crop-en-sidebar-full.png`. Yes/No (Visible, Header, Ligatures), Show/Hide (Reflection, Watermark, Line number), Default/Alternative (Background), None/Glass in a select (Border). `components/PropertyEditor/FrameStyleForm.tsx:96-99`, `WindowStyleForm.tsx:57-60`, `:118-121`, `:32-36`.
- **What the user feels.** Every row has to be read. Nothing can be scanned.
- **Fix.** One switch. The label carries the meaning ("Reflection", "Glass border", "Alternative background").
- **Effort.** S, and it comes free with UX-03.

### UX-12. German loses a label, keeps seven in English, and breaks words mid syllable. P2

- **Evidence.** `crop-de-sidebar-full.png`, `break-de-390-tab1.png`. The Radius row has no label in German because `i18n/sidebar.ts:61-88` has no `radius` key. "Hintergrundt yp", "Wasserzeich en" and "Zeilennumm er" break inside the word because of `hyphens: auto` with `wordBreak: break-word` at `components/PropertyEditor/EditorSidebar.css.ts:82-83`. Background, Aspect ratio, Theme, Formatter, Ligatures, Border and "Line start" stay English (`i18n/sidebar.ts:68`, `:77`, `:83-87`). "Default", "Alternative", "None", "Glass" and "Window" are hardcoded (`WindowStyleForm.tsx:34-35`, `:58-59`, `:89`). The "New" badge touches the font select in German.
- **What the user feels.** A half translated tool with a row that has lost its name.
- **Fix.** Add the missing keys. Let the label column size to its content up to a limit, then truncate with a `title`. Set `lang` on the root so hyphenation follows the locale, or turn hyphenation off.
- **Effort.** S.

### UX-13. Theme search has rough edges. P2

- **Evidence.** `break-theme-search-empty.png` (blank column, no message). Two characters filter nothing (`break-theme-search-2chars.png`, `state/theme/useFilteredThemes.tsx:12`). "GitHub Dark Dimmed" returns 2 cards because matching is by id substring (`useFilteredThemes.tsx:28`). "nightowl" returns 0. Arrow keys and Enter in the field do nothing (measured).
- **What the user feels.** Typing "gi" does nothing, so they think search is broken. An empty result looks like a crash.
- **Fix.** Filter from the first character. Match by exact id set, not substring. Show "No themes match" with a clear button. Arrow keys move into the results.
- **Effort.** S.

### UX-14. Text zoom breaks the sidebar, and pinch zoom is switched off. P2

- **Evidence.** `break-textzoom200-editor.png`. At a 200% root font size at least 18 of 20 labels overflow their 30px rows and two segment labels overlap ("Default" on "Alternative") (measured, `break3.mjs`). Text is in rem while rows are 30px and the panel is 280px (`EditorSidebar.css.ts:76`, `Scaffold.css.ts:5`). `apps/codeimage/index.html:21-22` sets `maximum-scale=1.0, user-scalable=no`.
- **What the user feels.** A user with a larger default font gets an unreadable panel. A phone user cannot zoom into their own code.
- **Fix.** Row height and panel width in rem with `min-height`. Remove the two zoom locks from the viewport tag.
- **Effort.** S.

### UX-15. Long content grows the frame with no fit, and floating chrome covers it. P2

- **Evidence.** `break-many-tabs.png` (six tabs make the frame 1616px in an 872px canvas). `break-long-line.png` (a 299 character line makes it 2881px, and the watermark sits on top of the code). `break-300-lines.png` (the floating toolbar covers the last lines). `break-long-tab-name.png` (the tab name is cut mid glyph with no ellipsis and no tooltip).
- **What the user feels.** With real code they work through a keyhole.
- **Fix.** Zoom to fit from UX-01. Middle truncation for tab names. Keep the watermark out of the text box. Move the toolbar out of the canvas.
- **Effort.** S after UX-01.

### UX-16. Canvas chrome collides at narrow widths. P2

- **Evidence.** `1024-dark-editor.png` (the action bar loses "Copy to clipboard" on the left and "Open" on the right, and footer links overlap it). `390-dark-editor.png` (footer links lie on the canvas). `break-320-editor.png` (the logo runs under the Sign in button and footer links wrap into each other). `components/Toolbar/FrameToolbar.css.ts:23-26` centres the bar absolutely with no wrap.
- **What the user feels.** Clutter over the one area that should be clean.
- **Fix.** Put the actions in the top toolbar or the dock. Move footer links into the menu. Collapse the logo to its mark below 400px.
- **Effort.** S.

### UX-17. Motion details. P3

Popovers, selects and the menu slide down 10px with `ease-in-out` over 250ms and ignore their trigger. The presets panel animates `margin-left`. `DynamicSizedContainer` animates width and height on every DOM change. Nothing honours reduced motion. Detail and fixes are in section 5.

### UX-18. Shortcut list details and no command menu. P3

- **Evidence.** `1440-dark-keyboard-shortcuts.png` shows "Ctrl" on macOS (`components/KeyboardShortcuts/KeyboardShortcuts.tsx:42-45`). The W shortcut for the watermark works but is not listed (`:91-94`). Cmd+K opens nothing (measured).
- **Fix.** Show the platform modifier. List every shortcut. Add a command menu (section 7, Dock).
- **Effort.** S for labels. M for the menu.

### UX-19. Small visual defects. P3

- "New" badges on Window, Border and Font still show (`crop-en-sidebar-full.png`). The badge hides after 3 views (`components/PropertyEditor/PanelRow.tsx:37`), so a first time visitor sees three of them.
- "GitHub Dark Dimmed" wraps to two centred lines inside a 30px trigger. "Monaspace Krypton" is cut to "Monaspace Kry..." with no tooltip (`break-longest-theme-font-names.png`).
- Focus rings exist but the outline colour is `rgba(0, 114, 245, 0.23)` (measured), which is faint on the dark panel (`kbd-focus-segmented.png`).
- The System fonts tab shows "Waiting for permission." with a spinner and no explanation or button (`1440-dark-popover-font-picker-tab1.png`). I saw this in headless Chromium only.
- The Formatter row disappears for languages without a formatter and the rows below jump up (`break-longest-theme-font-names.png`).

### 3a. `emil-design-eng` review of the controls

| Before                                                                                                                                           | After                                                                                                                           | Why                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Boolean as a 144x24px two segment control with a text pair (`FrameStyleForm.tsx:90-100`)                                                         | A switch about 28x16px at the right edge of the label row                                                                       | One glance, one click, one key. Frees about a third of the list height                  |
| Theme card 230x189px, one column (`ThemeSwitcher.css.ts:13`, `:27`)                                                                              | Tile about 88x44px, three columns, name in a caption strip                                                                      | All 26 visible at once makes comparison possible                                        |
| Select list rows 42px with 16px text, trigger 30px with 12.8px text (measured)                                                                   | Rows 28 to 30px with 13px text                                                                                                  | One scale for one panel                                                                 |
| Popover opens `right-end` over the frame (`SidebarPopover.tsx:20`)                                                                               | Opens inside the panel, or away from the frame                                                                                  | The control must not hide what it changes                                               |
| Popover and select enter with `translateY(-10px)` and no origin (measured)                                                                       | `transform-origin` at the trigger, `scale(0.97)` plus opacity                                                                   | Popovers should grow from their trigger                                                 |
| `animation: buttonPopKf .25s ease-out` on every button mount with a 1.02 overshoot (`packages/ui/src/lib/primitives/Button/Button.css.ts:23-55`) | No mount animation. Keep `:active { transform: scale(0.97) }` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)` | Mount motion has no purpose and fires on every sheet open (measured on the phone sheet) |
| `transition: all 250ms ease-in-out` (`controls/ColorPicker/CustomColorPicker.css.ts:64`)                                                         | Name the properties, or remove it                                                                                               | `all` animates properties nobody chose                                                  |
| Theme card hover overlay with no media query (`ThemeSwitcher.css.ts:87-91`)                                                                      | Wrap in `@media (hover: hover) and (pointer: fine)`                                                                             | Touch leaves the hover state stuck after a tap                                          |
| Theme card has no pressed state (`ThemeBox.tsx:19-26`)                                                                                           | `:active { transform: scale(0.98) }`, 160ms, same curve                                                                         | The card is the most pressed element and gives no feedback                              |
| Focus outline at 23% alpha (measured)                                                                                                            | Solid 2px ring with 2px offset                                                                                                  | A focus ring that is hard to see is not doing its job                                   |
| Label breaks mid word (`EditorSidebar.css.ts:82-83`)                                                                                             | Single line, ellipsis, `title` with the full text                                                                               | Broken words read as bugs                                                               |

### 3b. `apple-design` reading

- **Response.** Buttons from the kit scale to 0.972 on press (measured), which is right. Theme cards, popover triggers and segments give no press feedback.
- **Spatial consistency.** Popovers and menus enter from above whatever side their trigger is on. The presets panel enters and leaves along the same path, which is correct.
- **Materials.** The phone action bar uses `backdrop-filter: blur(20px) saturate(180%)` (`pages/Editor/App.css.ts:21`). The sheet and bottom bar are opaque strips that take fixed space. A translucent sheet over a scaled preview would keep the preview in view.
- **Reduced motion and transparency.** No `prefers-reduced-motion`, `prefers-reduced-transparency` or `prefers-contrast` rule exists in `apps/codeimage/src` or `packages/ui/src` (0 matches).
- **Typography.** Control text is 11.8 to 12.8px. Row labels are 12px at a 5.74 contrast ratio in light mode (measured). That passes, but it is small for the main reading text of the panel.
- **Simplicity.** "Show the common path first, advanced options one level deeper." The sidebar shows Aspect ratio, Border and Ligatures at the same level as Theme and Padding.
- **Familiarity.** Things that look the same should behave the same. Four of the 30px fields open a list below them, four open a 360px panel beside them, and nothing tells them apart except a chevron on some.
- **Flexibility.** The layout does not adapt to window size, zoom or text size (UX-01, UX-07, UX-14).
- **Agency.** There is no reset to default for an option or a section (no such control in the DOM dump). Presets cover saved states only.
- **Wayfinding.** On the phone the sheet answers "how do I get out" with one 30px button (UX-04).

### 3c. `mobile-native` check

Everything in this table was read from code or from Chromium emulation. None of it was run on a phone.

| Problem                                      | Where                                                                                 | Fix                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Zoom disabled                                | `apps/codeimage/index.html:21-22` (`maximum-scale=1.0, user-scalable=no`)             | Remove both. The text field in the sheet already computes to 16px (measured)                               |
| Hover styles not gated                       | 0 matches for `hover: hover` in app and UI package. Example `ThemeSwitcher.css.ts:90` | Wrap hover rules in `@media (hover: hover) and (pointer: fine)`                                            |
| Tap highlight left on                        | Computed `-webkit-tap-highlight-color` is `rgba(0, 0, 0, 0.18)` (measured)            | `html { -webkit-tap-highlight-color: transparent }` in `assets/styles/app.scss`                            |
| `touch-action: none` on `body`               | `assets/styles/app.scss:18`                                                           | Remove it. Put `touch-action: manipulation` on buttons and links                                           |
| Overscroll only on `body`                    | `assets/styles/app.scss:20`                                                           | `overscroll-behavior: none` on `html, body`, and `contain` on the sheet content (`BottomBar.css.ts:42-46`) |
| Sheet height in `vh`                         | `BottomBar.css.ts:45` (`maxHeight: '50vh'`)                                           | `50dvh`                                                                                                    |
| Buttons selectable on long press             | Kit button computes `user-select: auto` (measured)                                    | `user-select: none` and `-webkit-user-select: none` on buttons                                             |
| Press feedback missing on cards and segments | `ThemeBox.tsx:19-26`                                                                  | `:active` state, 100 to 160ms                                                                              |
| Preview scale computed once                  | `FrameHandler.tsx:28-37`                                                              | Recompute on resize, rotation and content change                                                           |

Held up. `viewport-fit=cover` is set and the bottom bar pads with `env(safe-area-inset-bottom, 20px)` (`BottomBar.css.ts:6`, `:15`). The app shell uses `100dvh` under 768px (`packages/ui/src/lib/theme/base.css.ts:5-13`). The theme strip uses native `scroll-snap-type: x mandatory` (`ThemeSwitcher.css.ts:22`). `theme-color` is updated from JavaScript when the app theme changes (`index.tsx:120-124`).

Needs a phone. Sticky hover, the tap highlight, safe areas at the top, keyboard behaviour over the sheet, the effect of `touch-action: none`, and whether the preview really loads clipped on iOS Safari.

---

## 4. `break-ui` results

Scope. The editor screen. I entered every worst case through the same boundary a user does (typing, pasting, the settings dialog, the window size). I did not wire the "Demo data / Worst case" toggle because the brief forbids source edits. The scripts `break1.mjs`, `break2.mjs` and `break3.mjs` replay every case.

Surface map.

| Field                | Source                                 | Limit                                     | Optional                    |
| -------------------- | -------------------------------------- | ----------------------------------------- | --------------------------- |
| Tab name             | user input, `Tabs/TabName/TabName.tsx` | none found (`maxLength` is -1 in the DOM) | yes, placeholder "Untitled" |
| Tab count            | `state/editor/editor.ts:45`            | 6 (`MAX_TABS`)                            | no                          |
| Code                 | CodeMirror content                     | none found                                | yes                         |
| Theme name           | `theme.properties.label`               | longest shipped is "GitHub Dark Dimmed"   | no                          |
| Font name            | font config                            | longest shipped is "Monaspace Krypton"    | no                          |
| Language name        | `SUPPORTED_LANGUAGES`                  | 31 entries, longest "Visual Basic"        | no                          |
| Option labels        | `i18n/sidebar.ts`                      | 4 locales (it, en, de, es)                | no                          |
| Theme list           | theme store                            | 26                                        | no                          |
| Window size and zoom | environment                            | none                                      | no                          |

### Part 1. What broke

| #   | Severity | Field         | Worst-case value                                                                                                                                          | What happens                                                                                   | Fix                                                                    | Screenshot                                                 |
| --- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Broken   | Window width  | 1440 resized to 600 with no reload                                                                                                                        | Canvas disappears, sidebar fills the window                                                    | Reactive breakpoint, `core/hooks/isMobile.tsx:5`                       | `break-resize-1440-to-600-no-reload.png`                   |
| 2   | Broken   | Window width  | 390 resized to 1440 with no reload                                                                                                                        | Phone layout with an empty canvas on a desktop window                                          | Same                                                                   | `break-resize-390-to-1440-no-reload.png`                   |
| 3   | Broken   | Tab count     | 6 tabs with names like `IMG_20250914_183022_HDR_portrait_edited_edited.HEIC`                                                                              | Frame grows to 1616px in an 872px canvas. Window controls and first tabs are off screen        | Zoom to fit, `Frame/FrameHandler.tsx:46`. Cap tab width                | `break-many-tabs.png`                                      |
| 4   | Broken   | Window width  | 1024 and 800                                                                                                                                              | Frame clipped. Action bar and footer clipped and overlapping                                   | UX-01, UX-16                                                           | `1024-dark-editor.png`, `800-dark-editor.png`              |
| 5   | Broken   | Phone width   | 390 and 320                                                                                                                                               | Frame loads off centre and cut on the right. At 320 the logo runs under Sign in                | `FrameHandler.tsx:28-37`. Collapse the logo                            | `390-dark-editor.png`, `break-320-editor.png`              |
| 6   | Broken   | Text size     | root font size 200%                                                                                                                                       | At least 18 of 20 labels overflow their rows, words break mid syllable, segment labels overlap | rem heights and widths, `EditorSidebar.css.ts:76`, `Scaffold.css.ts:5` | `break-textzoom200-editor.png`                             |
| 7   | Broken   | Keyboard      | Tab, Enter, Space, arrows                                                                                                                                 | 4 pickers do not open. 26 theme cards unreachable. 3 tab stops in a hidden panel               | UX-05                                                                  | `kbd-color-popover-enter.png`, `kbd-shift-tab.png`         |
| 8   | Broken   | Locale        | German                                                                                                                                                    | Radius row has no label. 3 labels break mid word. 7 labels stay English                        | `i18n/sidebar.ts:61-88`, `EditorSidebar.css.ts:82-83`                  | `crop-de-sidebar-full.png`                                 |
| 9   | Ugly     | Code          | one 299 character line                                                                                                                                    | Frame grows to 2881px. Watermark overlaps the code                                             | Zoom to fit. Keep the watermark outside the text box                   | `break-long-line.png`                                      |
| 10  | Ugly     | Code          | 300 lines                                                                                                                                                 | Floating action bar covers the last lines. Watermark overlaps line 300                         | Move the bar out of the canvas                                         | `break-300-lines.png`, `break-300-lines-scrolled.png`      |
| 11  | Ugly     | Tab name      | The catalog's long file name, `Q3 Board Deck`, a long dash, `FINAL (revised) v12 [approved by legal]`, with `.component.spec.tsx` appended. 75 characters | Cut mid glyph, no ellipsis, no tooltip. The extension that sets the icon is hidden             | Middle truncation and `title`, `Tabs/Tab/Tab.css.ts`                   | `break-long-tab-name.png`                                  |
| 12  | Ugly     | Theme name    | "GitHub Dark Dimmed"                                                                                                                                      | Wraps to two centred lines in a 30px select                                                    | `white-space: nowrap` with ellipsis on the value                       | `break-longest-theme-font-names.png`                       |
| 13  | Ugly     | Font name     | "Monaspace Krypton"                                                                                                                                       | Cut to "Monaspace Kry..." with no way to read it                                               | `title` on the trigger                                                 | `break-longest-theme-font-names.png`                       |
| 14  | Ugly     | Theme search  | "zzzz"                                                                                                                                                    | Empty column, no message                                                                       | Empty state, `ThemeSwitcher.tsx:69-115`                                | `break-theme-search-empty.png`                             |
| 15  | Ugly     | Theme search  | "gi", then "GitHub Dark Dimmed"                                                                                                                           | 2 characters filter nothing. The full name returns 2 cards                                     | `useFilteredThemes.tsx:12`, `:28`                                      | `break-theme-search-2chars.png`                            |
| 16  | Ugly     | Browser zoom  | 200% on a 1440x900 window                                                                                                                                 | Phone layout. Styles sheet covers the preview                                                  | UX-04, UX-07                                                           | `break-zoom200-editor.png`, `break-zoom200-tab-styles.png` |
| 17  | Fragile  | Tab name      | any                                                                                                                                                       | No length limit in the field                                                                   | Add a limit and match it server side                                   | `break-long-tab-name-editing.png`                          |
| 18  | Fragile  | Option labels | German "Schriftart" plus the "New" badge                                                                                                                  | Badge touches the control. One more character overlaps it                                      | Let the label truncate before the badge                                | `crop-de-sidebar-full.png`                                 |

### Part 2. Decisions for you

- Long tab names. Truncate in the middle so the extension stays visible. I recommend that over end truncation because the extension drives the icon.
- Long lines. Either keep growing the frame and zoom the canvas to fit, or add a wrap option. I recommend zoom to fit first because it also fixes rows 3, 4 and 5.
- Empty code. The frame shrinks to tabs and watermark (`break-empty-code.png`). A placeholder line would help new users. I recommend one.
- Themes at 100 or more. Not needed for 26. If custom themes arrive, group and filter before virtualizing.

### Part 3. What held up

- Document width never exceeds the window at 1440, 1024, 800, 768, 390 or 320 (measured `scrollWidth`).
- Tab count is capped at 6 and the add button disables at the cap.
- Escape closes selects and returns focus to the trigger. Escape leaves the code editor, and Tab then moves on to the action bar.
- Focus rings render on buttons, selects, segments and picker triggers (`kbd-focus-select.png`, `kbd-focus-segmented.png`, `kbd-focus-color-trigger.png`).
- German labels fit inside the phone sheet with no clipped text (measured).
- Light mode has no hardcoded dark surfaces in any view I captured (`1440-light-editor.png`, `1440-light-popover-color-picker.png`, `1440-light-export-dialog.png`, `390-light-tab-styles.png`).
- The canvas scrolls in both axes, so long content is reachable even though it does not fit.

---

## 5. Motion review and opportunities

### 5.1 Inventory

Durations and easings were read from the running page with `document.getAnimations()` (`motion.mjs`, `motion2.mjs`) and matched to source where the source is in this repo. Entries marked "kit" come from `@codeui/kit` 0.1.5 in `node_modules` and were measured at runtime only.

| Trigger                                    | What animates                                                          | Duration and easing                                                                                                                    | Source                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Open select                                | `translateY(-10px)` to 0, opacity 0 to 1                               | 250ms `ease-in-out` keyframes                                                                                                          | kit `Select_contentShow`                                             |
| Close select                               | reverse                                                                | 250ms `ease-in-out` keyframes                                                                                                          | kit `Select_contentHide`                                             |
| Open popover (colour, ratio, window, font) | same as select                                                         | 250ms `ease-in-out` keyframes                                                                                                          | kit `Popover_contentShow`                                            |
| Open menu                                  | same as select                                                         | 250ms `ease-in-out` keyframes                                                                                                          | kit `Dropdown_contentShow`                                           |
| Open and close dialog                      | `scale(0.95) translateY(10px)` to none, opacity                        | 250ms `ease-in-out` keyframes, same both ways                                                                                          | kit `Dialog_contentShow`, `Dialog_contentHide`                       |
| Segment change                             | indicator `transform` and `width`                                      | 250ms `cubic-bezier(0.2, 0, 0, 1)` (kit). 150ms same curve in `packages/ui/src/lib/primitives/SegmentedField/SegmentedField.css.ts:74` | kit and UI package                                                   |
| Segment mount                              | indicator `transform` none to `translateX(0)`                          | 250ms                                                                                                                                  | kit, fires 6 times when the phone sheet opens                        |
| Any DOM change in a sidebar section        | `width` and `height`, often to the same value                          | 200ms `cubic-bezier(0.4, 0, 0.2, 1)`                                                                                                   | `ui/DynamicSizedContainer/DynamicSizedContainer.tsx:19-27`, `:51-52` |
| Presets panel                              | `margin-left` -280px to 0, opacity                                     | 300ms `ease`                                                                                                                           | `pages/Editor/components/LeftSidebar.tsx:36-52`                      |
| Shortcuts popover                          | opacity                                                                | 200ms `ease` in, 200ms `ease-in-out` out                                                                                               | `packages/ui/src/lib/primitives/Transition/Transition.css.ts:4-22`   |
| Button hover and press                     | background 200ms. `transform` to `scale(0.972)` 200ms `ease`           | kit Button                                                                                                                             |
| Button focus                               | `outline-offset` 0 to 4px                                              | 150ms `ease-in`                                                                                                                        | kit Button                                                           |
| Button mount (UI package buttons)          | scale 0.95, 1.02, 1                                                    | 250ms `ease-out` keyframes                                                                                                             | `packages/ui/src/lib/primitives/Button/Button.css.ts:23-55`          |
| Theme card hover                           | overlay opacity                                                        | 200ms `ease-in-out`                                                                                                                    | `components/ThemeSwitcher/ThemeSwitcher.css.ts:87`                   |
| Padding or radius change                   | `padding`, `border-radius`, background                                 | 200ms `ease`                                                                                                                           | `components/Frame/Frame.css.ts:101`                                  |
| Terminal shadow, radius, background        | 200ms                                                                  | `components/Terminal/terminal.css.ts:34`, `:88`                                                                                        |
| Tab strip                                  | `all` 150ms `ease-in-out`. `width` 150ms, `height` 50ms                | `components/Terminal/Tabs/Tab/Tab.css.ts:50`, `:77`                                                                                    |
| Tab icon list                              | `all` 200ms `ease-in-out`. Show 150ms `ease-out`. Hide 150ms `ease-in` | `components/Terminal/Tabs/TabName/TabName.css.ts:37-43`                                                                                |
| Colour picker popover                      | `all` 250ms `ease-in-out`                                              | `components/PropertyEditor/controls/ColorPicker/CustomColorPicker.css.ts:64`                                                           |
| "New" badge                                | opacity 0 to 1                                                         | 300ms                                                                                                                                  | `components/FeatureBadge/FeatureBadge.tsx:22-28`                     |
| Frame resize handle                        | `transform` 100ms `ease`                                               | `components/Frame/Frame.css.ts:160`                                                                                                    |
| Skeleton and spinner                       | 1s `linear` infinite                                                   | `ui/Skeleton/Skeleton.css.ts:54`, `packages/ui/src/lib/primitives/Loader/LoadingCircle.css.ts:10`                                      |
| Phone sheet open and close                 | nothing. It appears and disappears                                     | `components/BottomBar/BottomBar.tsx:61`                                                                                                |
| Theme change on the canvas                 | nothing on the code colours                                            | not animated                                                                                                                           |

### 5.2 `review-animations`, part 1. Findings

| Before                                                                                                                                                            | After                                                                                                                                                                                                                           | Why                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Select, popover and menu content. `translateY(-10px)` plus opacity, 250ms `ease-in-out`, same on exit (kit, measured)                                             | `transform-origin: var(--kb-popover-content-transform-origin)` (Kobalte's variable, already used at `TabName.css.ts:38` for the combobox). `scale(0.97)` plus opacity. Enter 180ms `cubic-bezier(0.23, 1, 0.32, 1)`. Exit 150ms | Entering elements use ease-out. Popovers scale from their trigger. Selects belong in 150 to 250ms. Exit should be faster than enter |
| Dialog. `scale(0.95) translateY(10px)`, 250ms `ease-in-out` both ways (kit)                                                                                       | `scale(0.96)` plus opacity, 200ms `cubic-bezier(0.23, 1, 0.32, 1)` in, 150ms out, origin stays centred                                                                                                                          | Weak built in easing on a deliberate animation. Symmetric timing                                                                    |
| `animation: contentHide 150ms ease-in forwards` (`TabName.css.ts:39`)                                                                                             | `ease-out`, or no exit animation                                                                                                                                                                                                | `ease-in` on UI is a block                                                                                                          |
| `transition: 'all 200ms ease-in-out'` (`TabName.css.ts:37`), `'all 150ms ease-in-out'` (`Tab.css.ts:50`), `all 250ms ease-in-out` (`CustomColorPicker.css.ts:64`) | Name `opacity` and `transform`, or delete                                                                                                                                                                                       | `transition: all` is unbounded                                                                                                      |
| `Motion.div` animating `marginLeft` and opacity over 300ms `ease` (`LeftSidebar.tsx:36-52`)                                                                       | Overlay panel moved with `transform: translateX(-100%)` to 0, 250ms `cubic-bezier(0.32, 0.72, 0, 1)`, exit 200ms                                                                                                                | `margin-left` runs layout on every frame and reflows the canvas while it moves                                                      |
| `animate(ref, {width, height}, {duration: 0.2})` on every subtree mutation (`DynamicSizedContainer.tsx:19-27`, `:51-52`)                                          | Delete the wrapper. If a section must grow, animate measured height on that section only, when the height really changes                                                                                                        | Layout properties. It fires on every select open and every theme click with identical start and end values (measured)               |
| `transition: 'background-color .2s, padding .2s, border-radius .2s'` on the frame (`Frame.css.ts:101`)                                                            | Drop `padding` and `border-radius` from the list                                                                                                                                                                                | Layout property, and the P shortcut triggers it from the keyboard                                                                   |
| Shortcuts popover fades 200ms when opened with `?` (`KeyboardShortcuts.tsx:96-99`, `:117`)                                                                        | No animation on the keyboard path                                                                                                                                                                                               | Never animate keyboard initiated actions                                                                                            |
| `outline-offset 0.15s ease-in` on focus (kit Button, measured)                                                                                                    | No transition on the focus ring                                                                                                                                                                                                 | Focus moves with the keyboard, and `ease-in` delays it                                                                              |
| `animation: buttonPopKf .25s ease-out` on mount (`packages/ui/src/lib/primitives/Button/Button.css.ts:55`)                                                        | Delete                                                                                                                                                                                                                          | No purpose. Bounce on a tool panel. Restarts on every remount                                                                       |
| Button press `transform .2s` with default `ease` (kit, measured)                                                                                                  | `transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`, `scale(0.97)`                                                                                                                                                                 | Press feedback belongs in 100 to 160ms                                                                                              |
| Segment indicator 250ms, animates `width`, and animates on mount (kit, measured)                                                                                  | 150ms, `transform` only, no mount animation                                                                                                                                                                                     | Tens of uses a day. `width` is a layout property                                                                                    |
| Theme card overlay `opacity 0.2s ease-in-out` on bare `:hover` (`ThemeSwitcher.css.ts:87-91`)                                                                     | `opacity 150ms ease` inside `@media (hover: hover) and (pointer: fine)`                                                                                                                                                         | Hover uses `ease`. Ungated hover sticks on touch                                                                                    |
| No `prefers-reduced-motion` rule anywhere (0 matches)                                                                                                             | One global rule that removes transforms and keeps opacity and colour                                                                                                                                                            | Reduced motion must be honoured                                                                                                     |

### 5.3 `review-animations`, part 2. Verdict

1. **Feel-breaking.** `ease-in` on the tab icon list exit. Animation on keyboard actions (`?`, `P`, focus rings). `ease-in-out` on every enter.
2. **Missed simplifications.** `DynamicSizedContainer` and the button mount keyframes should be deleted. Three `transition: all` declarations should be narrowed or removed.
3. **Performance.** `margin-left`, `width`, `height` and `padding` are animated. Each has a transform or no-animation replacement.
4. **Interruptibility and timing.** Popovers, selects, menus and dialogs use keyframes with identical enter and exit times. A quick open and close restarts from zero.
5. **Origin and cohesion.** No trigger anchored popover sets a transform origin. The kit uses 250ms, the UI package 150 to 225ms, and the app 200 to 300ms, with five different curves.
6. **Accessibility.** No reduced motion handling. No hover gating.

**Decision. Block.** The fixes are small and most are deletions. Most popover motion lives in `@codeui/kit`, which Riccardo owns, so the fix belongs there.

### 5.4 `find-animation-opportunities`, part 1. Opportunities

| #   | Location                                                                                                            | Today                                                                         | Purpose                                          | Frequency  | Suggested motion                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `components/BottomBar/BottomBar.tsx:61-97`                                                                          | The phone sheet appears and disappears instantly                              | Preventing a jarring change, spatial consistency | Occasional | Enter from `transform: translateY(100%)` to 0 with `transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1)`. Exit along the same path in 200ms. Drag to dismiss with velocity over about 0.11 px/ms and rubber banding at the top stop. Reduced motion gets a 200ms opacity fade |
| 2   | `components/ThemeSwitcher/ThemeBox.tsx:19`                                                                          | Theme cards have no pressed state                                             | Feedback                                         | Tens a day | `:active { transform: scale(0.98) }` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`. Small enough for the frequency                                                                                                                                               |
| 3   | `components/PropertyEditor/FrameStyleForm.tsx:105-141`, `WindowStyleForm.tsx:86-106`, `EditorStyleForm.tsx:227-253` | Rows that depend on a toggle pop in at full opacity while the wrapper resizes | State indication                                 | Occasional | Animate the measured height of that one group over 200ms `cubic-bezier(0.23, 1, 0.32, 1)` and fade the new rows from `opacity: 0` over 150ms. Reduced motion keeps the fade only                                                                                                     |
| 4   | Popover and select content in `@codeui/kit`                                                                         | Slides from above                                                             | Spatial consistency                              | Occasional | The values in the first row of 5.2                                                                                                                                                                                                                                                   |
| 5   | `components/Presets/EmptyPresetFallback/EmptyPresetFallback.tsx`                                                    | The empty presets state appears flat                                          | Delight, at the rare tier                        | Rare       | Illustration, title and button enter with `opacity: 0; transform: translateY(8px)` over 300ms `cubic-bezier(0.23, 1, 0.32, 1)` with delays of 0, 50 and 90ms. Never blocks the button                                                                                                |

### 5.5 Part 2. Rejected candidates

- Command menu open and close (if one is built). **Rejected. Keyboard initiated, 100 or more a day. Never animate.**
- Theme preview on hover or arrow key. **Rejected. The user is comparing themes. The canvas must change at once.**
- Crossfade of code colours when the theme changes. **Rejected. Tens of times a day while browsing, and it delays the thing being judged.**
- Switch and segment toggles beyond a 150ms knob slide. **Rejected. Frequent toggles get near imperceptible motion only.**
- Stagger on the theme grid when the panel opens. **Rejected. It is the main list and the user opens it constantly.**

### 5.6 Part 3. Verdict

This interface needs less motion than it has and one new piece. Delete the wrapper resize, the button pop and the keyboard path fades, fix the popover origin and easing in the kit, and add the sheet transition. The sheet has the highest leverage because it is the only place where content teleports. To turn a row into a plan, hand it to `improve-animations plan <suggestion>`. I could not judge feel from headless runs, so the curves above are the skill's standard values and need a look at real speed.

---

## 6. Library recommendation (`pick-ui-library`)

**Installed today** (`apps/codeimage/package.json`). `@codeui/kit` ^0.1.5 (Riccardo's own kit, built on Kobalte), `@kobalte/core` ^0.13.11, `solid-headless` ^0.13.1, `@corvu/utils` 0.4.2, `@motionone/solid` ^10.16.2, `motion` ^10.15.5, `@thisbeyond/solid-dnd` 0.7.5, `@floating-ui/dom`, `clsx`, `statebuilder`, vanilla-extract. The repo is on `solid-js` ^1.9.12 (`pnpm-workspace.yaml:40`).

**The curated list is React.** base-ui, cmdk, Sonner, Vaul, NumberFlow, dnd kit and Virtuoso all need React. `@base-ui/react` 1.9.0 (published 2026-10-09) lists `react` as a peer dependency. So for this Solid app every pick below leaves the curated list, and I say so per row. Versions and dates are from the npm registry today.

| Task                           | Curated pick                             | Pick for this app                                                                                            | Status checked today                                                                                                                                                                                                                                     | Source                                                                                                                                     |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Unstyled accessible components | base-ui (React only)                     | Stay on Kobalte through `@codeui/kit`. Do not add a second library                                           | `@kobalte/core` 0.13.14, published 2026-09-07, peer `solid-js ^1.9.8`. Still 0.x. `@codeui/kit` 0.1.5 was last published 2024-10-31                                                                                                                      | https://registry.npmjs.org/@kobalte%2fcore , https://registry.npmjs.org/@codeui%2fkit , https://base-ui.com/react/overview/releases/v1-0-0 |
| Command menu                   | cmdk (React only)                        | `cmdk-solid`                                                                                                 | 1.2.0, published 2026-08-30, peer `@kobalte/core >=0.12.4 <1`. A 2.0.0-rc.0 is on the `next` tag                                                                                                                                                         | https://registry.npmjs.org/cmdk-solid                                                                                                      |
| Toasts                         | Sonner (React only)                      | `solid-sonner`                                                                                               | 0.3.3, published 2026-10-27                                                                                                                                                                                                                              | https://registry.npmjs.org/solid-sonner                                                                                                    |
| Bottom sheet                   | Vaul (React only, 1.1.2 from 2024-12-14) | `@corvu/drawer`                                                                                              | 0.2.4, published 2025-04-08, 19 months ago. It works on Solid 1.8 and later but is not moving. The repo already depends on `@corvu/utils`                                                                                                                | https://registry.npmjs.org/@corvu%2fdrawer , https://registry.npmjs.org/vaul                                                               |
| Animation                      | motion                                   | CSS transitions for everything in section 5. The vanilla `animate()` from `motion` only for the sheet spring | `motion` 14.14.0, published 2026-11-13. The repo pins ^10.15.5. `@motionone/solid` 10.16.4 was last published 2023-09-21 and has two call sites (`pages/Editor/components/LeftSidebar.tsx:36`, `components/FeatureBadge/FeatureBadge.tsx:22`). Remove it | https://registry.npmjs.org/motion , https://registry.npmjs.org/@motionone%2fsolid                                                          |
| Virtualization                 | Virtuoso (React only)                    | None needed for 26 themes and 31 languages. If lists grow, `@tanstack/solid-virtual`                         | 3.13.53, published 2026-11-03                                                                                                                                                                                                                            | https://registry.npmjs.org/@tanstack%2fsolid-virtual                                                                                       |
| Class names and variants       | clsx, cva                                | Keep `clsx` and vanilla-extract recipes. Recipes already do what cva does                                    | installed                                                                                                                                                                                                                                                | `apps/codeimage/package.json`                                                                                                              |
| State                          | zustand                                  | Keep `statebuilder`                                                                                          | installed                                                                                                                                                                                                                                                | `apps/codeimage/package.json`                                                                                                              |

**One flag, no churn.** Ark UI for Solid is the most active alternative (`@ark-ui/solid` 5.40.0, published 2026-10-29, with 6.0.0-next.0 on `next`, https://registry.npmjs.org/@ark-ui%2fsolid and https://ark-ui.com/solid/docs/overview/changelog). I do not recommend switching for this redesign. Kobalte already covers switch, collapsible, popover, select, dialog and combobox, and the kit wraps it.

**One removal.** `solid-headless` is a second headless library used for the shortcuts popover (`KeyboardShortcuts.tsx:14`) and the old transition helper. Move those to the kit and drop it.

**Solid 2.** `solid-js` 1.9.19 is `latest` and 2.0.0-rc.21 is on `next` (https://registry.npmjs.org/solid-js). Kobalte's peer range is `^1.9.8`. Ark, Zag and cmdk-solid each have a `next` major. That those majors track Solid 2 is a guess. Check before any Solid 2 upgrade.

---

## 7. Prototype directions for the editor controls

The working set covers three different axes, so I confirm all three and sharpen each. I would not replace any. Rules that apply to all three, so the comparison is about layout only:

- One control area, not two. The canvas gets the freed width and zooms to fit (UX-01).
- Booleans are switches (UX-03, UX-11). The default theme id is fixed (UX-06).
- Theme target. All 26 themes visible without scrolling at 1440x900. At most 2 interactions to any theme at 390. Arrow keys preview on the canvas at once.
- Controls must not cover the frame they change.

### Inspector. Axis: density

Confirmed, with a number to hit.

- 1440. One right panel about 300px wide replaces both sidebars. The canvas grows from 872px to about 1130px.
- The theme picker is the first section. A 3 column tile grid, 9 rows of about 44px, with a search field and dark and light chips above it. The grid is about 400px tall (inferred by arithmetic, not built). The section collapses to one row that shows the current theme.
- Below it, Frame, Window, Code and Font as collapsible sections with 28px rows, the label on the left and the value on the right, as chalk.ist does. Switches for the 8 booleans. Rare options sit behind a "More" row in each section.
- Colour, ratio, window and font pickers expand inline inside their section.
- 390. A bottom sheet with two stops. The short stop is one row of chips (Theme, Background, Padding, Language). The tall stop is the same sections stacked, with the theme grid at 3 columns.
- Right when most users set several options per image and want everything in reach. It is the lowest risk path because every control keeps a home.
- Cost. It is still a form. With all sections open it will scroll again on a 768px tall window. Needs a switch, a collapsible and a tile grid in the kit. Effort M.

### Dock. Axis: interaction model

Confirmed, with two changes. The dock sits outside the frame bounds, and the command menu is the main way to reach rare options.

- 1440. No side panels. The canvas takes the full width. A dock under the frame holds the six controls people touch most (Theme, Background, Padding, Language, Font, Export), as ray.so does with six.
- Theme opens a popover above the dock. A searchable tile grid of all 26, with hover and arrow key preview on the canvas.
- A "More" button opens grouped popovers for Frame, Window and Code. Each group is at most 7 rows of switches and selects.
- Cmd+K opens a command menu that lists every theme and every option ("Toggle watermark", "Padding 64", "Font: Geist Mono"). Moving the highlight previews the change. Enter commits. Escape restores.
- 390. The dock is the bottom bar. Each item opens a short sheet of at most 40% of the height, so the preview stays visible above it.
- Right when most sessions are paste, pick a theme, export. That is a guess. The app tracks `theme-change`, `change-language` and `change-shadow` events (`ThemeSwitcher.tsx:40`, `EditorStyleForm.tsx:126`, `WindowStyleForm.tsx:158`), so the usage data may exist. I did not see it.
- Cost. 15 options lose their always visible home, so discoverability drops. Popovers must be placed so they never sit on the frame. The command menu with preview and restore is new work with `cmdk-solid`. Effort L.

### Studio. Axis: structure

Confirmed, with the rail items named.

- 1440. A 48px icon rail on the left (Themes, Frame, Window, Code, Presets, Export) and one 280px panel beside it. The canvas grows from 872px to about 1110px. Clicking the active icon collapses the panel and gives the canvas everything.
- The Themes panel is a gallery and is wider than the others, about 360px. A 3 column grid of tiles larger than the Inspector's (about 104x64px plus a name), search, and chips for dark and light. 9 rows of about 84px make about 760px, which fits a 900px tall window with about 40px to spare. That height is inferred by arithmetic, not built.
- Every other panel holds 3 to 7 rows and never scrolls. Export settings get one home, which resolves UX-09.
- 390. The rail becomes the bottom tab bar with 5 items. Each opens a sheet with two stops. Themes is a 3 column grid.
- Right when the product keeps growing (presets, fonts, export formats, a future custom theme editor). Each area gets room and a name.
- Cost. One more click to change category. The theme list and the options are never visible together. Needs icons people can read without labels, or labels under the icons at 64px. Effort M to L.

### My read

Inspector is the safest and matches chalk.ist. Dock has the largest upside for the common case and the largest risk. Studio scales best. The command menu from Dock is worth building whichever layout wins, because it also fixes the keyboard path to themes. This paragraph is judgment, not measurement.

---

## 8. Quick wins that need no redesign

Each is under an hour unless noted. File and line included.

1. Fix the default theme id. `state/editor/editor.ts:35`, `'fleetTheme'` to `'fleetDark'`. The selected card and the Theme select then show on first load.
2. Add the missing German `radius` key and translate the 7 English leftovers. `i18n/sidebar.ts:61-88`.
3. Fix the three wrong `for` ids. `EditorStyleForm.tsx:140`, `:302`, `WindowStyleForm.tsx:172`. Better, generate the id in `PanelRow.tsx`.
4. Remove `maximum-scale=1.0, user-scalable=no`. `apps/codeimage/index.html:21-22`.
5. Make `useModality` reactive with a `matchMedia` change listener. `core/hooks/isMobile.tsx:5`.
6. Stop mid word breaks. Remove `hyphens: 'auto'` and `wordBreak: 'break-word'`, add ellipsis and a `title`. `EditorSidebar.css.ts:82-83`.
7. Theme search. Filter from 1 character (`useFilteredThemes.tsx:12`), match on an id set (`:28`), and render a "No themes match" line.
8. Show the theme search on phones. Remove the `modality === 'full'` guard at `ThemeSwitcher.tsx:60`.
9. Do not try to fix the theme list with spacing alone. I tested it with injected CSS (`quickwin.mjs`). A 12px gap still shows 3 whole cards. A 12px gap with two columns shows 4, because the code sample wraps and each card grows to 136x281px (`quickwin-theme-grid-2col-injected-css.png`). The card content has to become a tile, which is UX-02 and not an afternoon job.
10. Make theme cards buttons. `ThemeBox.tsx:19`, `div` to `button type="button"` with `aria-pressed`. Keyboard access and a focus ring come with it.
11. Take the closed presets panel out of the tab order with `inert`. `LeftSidebar.tsx:36`.
12. One export scale. Read and write `exportCanvasStore` in the dialog and delete the local signal at `ExportButton.tsx:137-138`. Rename the `aria-label` from "hint" at `ExportSettingsButton.tsx:11`.
13. Platform modifier in the shortcuts list, and add the W row. `KeyboardShortcuts.tsx:36-47`.
14. Delete `DynamicSizedContainer` wrappers in `EditorSidebar.tsx:10-17` and `EditorStyleForm.tsx:111`, `:258`, or guard the animation so it only runs when the size changes.
15. Delete the button mount keyframes. `packages/ui/src/lib/primitives/Button/Button.css.ts:23-33`, `:55`.
16. Replace the three `transition: all` declarations and the `ease-in` exit. `CustomColorPicker.css.ts:64`, `TabName.css.ts:37`, `:39`, `Tab.css.ts:50`.
17. Add a global reduced motion rule and gate hover rules. Start with `ThemeSwitcher.css.ts:87-91`.
18. Phone basics in `assets/styles/app.scss`. Tap highlight transparent on `html`, remove `touch-action: none` from `body` (`:18`), `overscroll-behavior: none` on `html`.
19. Close the phone sheet on Escape and on a tap outside. `BottomBar.tsx:61`.
20. Open sidebar popovers away from the frame. `SidebarPopover.tsx:20`, try `right-start` with a collision boundary that excludes the frame. Half a day to tune.

---

## 9. Prior art, checked online on 2026-11-14

I opened each tool in headless Chromium at 1440x900 and 390x844 (`prior.mjs`, `prior2.mjs`). Screenshots are `prior-*.png` in the same folder.

| Tool                            | Layout                                                                                                                                                                                                                                                                                                                                                                                                                                              | Theme picker                                                                                                                                           | Booleans                                                                                                                   | Controls on screen at 1440x900 | Phone                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| Ray.so, https://ray.so/         | Canvas centred. One floating dock under the frame with 6 controls (`prior-rayso-1440.png`)                                                                                                                                                                                                                                                                                                                                                          | A combobox with search. 32 themes in two groups, each a colour dot and a name, in a 198x320px list anchored to the dock (`prior-rayso-theme-open.png`) | 3 switches                                                                                                                 | 16                             | The same dock as a bottom strip (`prior-rayso-390.png`)                                 |
| Chalk.ist, https://chalk.ist/   | One left inspector about 281px wide, canvas on the right, a small top bar for blocks, decorations and export (`prior-chalkist-1440.png`)                                                                                                                                                                                                                                                                                                            | A compact select in the first row ("Color theme: Vue"), plus a 7 column swatch grid for backdrops                                                      | 7 switches of 28x20px in the first screen                                                                                  | 80                             | Preview on top, a "Download PNG" bar and an expandable sheet (`prior-chalkist-390.png`) |
| Carbon, https://carbon.now.sh/  | A toolbar above the frame (`prior-carbon-1440.png`)                                                                                                                                                                                                                                                                                                                                                                                                 | A Theme combobox and a Language combobox in the toolbar                                                                                                | Checkmarks inside a gear menu with Window, Editor and Misc groups and preset thumbnails (`prior-carbon-settings-open.png`) | 13                             | The toolbar stacks above the frame (`prior-carbon-390.png`)                             |
| Snappify, https://snappify.com/ | The editor is behind sign in. I saw the landing page only (`prior-snappify-1440.png`)                                                                                                                                                                                                                                                                                                                                                               | not checked                                                                                                                                            | not checked                                                                                                                | not checked                    | not checked                                                                             |
| Figma properties panel          | One right panel. Sections depend on the selection, for example "Corner radius", "Fill", "Stroke", "Effects", "Export settings" (https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar). Figma's UI3 help says the panel can be resized and the whole UI can be minimized (https://help.figma.com/hc/articles/23954856027159, read through a search summary, not the page itself) | n/a                                                                                                                                                    | n/a                                                                                                                        | n/a                            | n/a                                                                                     |
| Linear command menu             | Cmd+K or Ctrl+K opens a menu where you type a page or action name (https://linear.app/enablement/guide/navigating-linear). Linear's changelog calls it one of the core components (https://linear.app/changelog/2019-12-18-new-command-menu). Both read through search summaries                                                                                                                                                                    | n/a                                                                                                                                                    | n/a                                                                                                                        | n/a                            | n/a                                                                                     |

**Patterns CodeImage lacks.**

- One control area. Ray.so, chalk.ist and Carbon each have one. CodeImage has two sidebars plus a floating bar plus a footer.
- Switches for booleans. Ray.so and chalk.ist use them. CodeImage uses none.
- A compact theme list with search that works from the keyboard. Ray.so shows 32 themes in a 320px list. CodeImage needs 5803px for 26.
- A canvas that keeps its size. Ray.so's dock and chalk.ist's 281px panel leave the frame whole at 1440. CodeImage clips its frame from about 1160px down.
- Density. Chalk.ist puts 80 controls in one 900px screen with 28x20px switches and inline values. CodeImage puts 20 option rows in 1091px.
- A command menu. Ray.so binds Cmd+K to its export menu and single keys to colours (C), line numbers (N) and language (L) (`prior-rayso-about.png`). CodeImage has no menu and no theme or language key.

**Where CodeImage is already ahead.**

- Theme previews render real highlighted code with the theme's own background. Ray.so shows a dot and a name.
- Multiple tabs per window with file icons. None of the three others showed tabs.
- A window style picker, an aspect ratio picker with 10 presets, system fonts, presets, and four UI languages.
- The single key shortcuts F, Esc, B, D and P match ray.so's.

---

## 10. What I could not check

- A real phone. Every mobile observation is from Chromium emulation. Sticky hover, the tap highlight, safe areas, the keyboard and the effect of `touch-action: none` need hardware.
- Safari and Firefox. Chromium only.
- Screen reader output. I read roles and names from the DOM and did not run VoiceOver.
- Feel of motion at real speed. Durations and curves are measured. Headless runs cannot show whether they feel right.
- The source of `@codeui/kit` animations. I measured them at runtime and did not read the kit's CSS.
- The Snappify editor, the Figma app and the Linear app. Snappify needs an account. Figma and Linear are cited from help pages and search summaries.
- The System fonts tab beyond its waiting state, image upload in the colour picker, the signed in dashboard and saved presets, copy and export end to end, and tooltip delay timing.
- Right to left layout. The app ships no RTL locale.
- Italian and Spanish. I checked German as the long locale only.
- Which options people use. I saw analytics calls in the code and no data.
- Whether the tile grids in section 7 fit as described. Their heights are arithmetic, not built. The one layout change I did test with injected CSS (two columns of today's cards) failed, see quick win 9.
