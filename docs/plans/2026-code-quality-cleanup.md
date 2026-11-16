# Code quality cleanup after the 2026 editor work

The follow-up plan to the lint baseline added with `scripts/lint.mjs`. That change froze the existing debt in `lint-baseline.json` and stopped it from growing. This plan pays the debt down and gives the app's styles shared tokens.

Nothing here is started. Each workstream is one or more PRs to `main`, and the operator decides the order and the design choices marked **Decision**.

## Starting point

Numbers from `lint-baseline.json` on 2026-11-16, at the commit that adds this file.

| Rule                                       | Findings | Files |
| ------------------------------------------ | -------- | ----- |
| `codeimage/no-comments`                    | 2022     | 325   |
| `codeimage/no-global-style`                | 149      | 23    |
| `@typescript-eslint/no-non-null-assertion` | 140      | 71    |
| `no-restricted-imports` (path aliases)     | 84       | 59    |
| `max-lines-per-function`                   | 82       | 56    |
| `codeimage/disable-directive-format`       | 68       | 46    |
| `max-depth`                                | 67       | 15    |
| `no-nested-ternary`                        | 64       | 43    |
| `max-lines`                                | 54 files | 54    |
| `solid/reactivity`                         | 37       | 21    |
| `codeimage/no-document-query`              | 36       | 22    |
| `codeimage/no-static-inline-style`         | 31       | 19    |
| `unused-disable-directive`                 | 28       | 17    |
| `import/no-cycle`                          | 19       | 12    |

To refresh the table, read `lint-baseline.json` after `pnpm lint:tighten`.

For comparison, the app source before the 2026 work (`27b185f1`, 2026-03-27) had 280 files, none over 360 lines, 107 comment lines and 7 `globalStyle` calls in one file.

## Rules for every PR of this plan

- One workstream step per PR. Do not mix a token migration with a file split.
- A PR that removes findings runs `pnpm lint:tighten` and commits the lowered `lint-baseline.json`. No PR raises an entry.
- A PR that moves or renames a file moves its `lint-baseline.json` entry in the same commit.
- A PR that adds a check proves it fails on the mistake it targets, and adds its row to the table in `AGENTS.md`.
- Style changes are verified in the browser with the `verify-codeimage` skill: Sidebar and Dock layouts, light and dark, at 1440x900, 900x700 and 390x844. Screenshots before and after stay outside the checkout.
- Many branches touch these files. Before starting a step, list the open PRs that touch its files and either wait for them or tell their owners.

## Workstream A: shared style tokens

The 2026 style files repeat values that the app has no token for. Each step adds the token, migrates the uses and adds a check so the literal cannot return.

### A1. Breakpoints and reduced motion

**Today.** Nine files define their own phone breakpoint, in three forms:

| Form                              | Files                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'screen and (max-width: 768px)'` | `agent-tools/tool-activity.css.ts`, `controls/canvas-toolbar.css.ts`, `controls/controls.css.ts` (named `compact`), `shell/export-styles/sheet.css.ts`, `shell/header.css.ts`, `shell/settings.css.ts` |
| `'(max-width: 768px)'`            | `variants/sidebar/accordion.css.ts`                                                                                                                                                                    |
| `'(max-width: 767px)'`            | `variants/dock/dock.css.ts`                                                                                                                                                                            |

Paths are under `apps/codeimage/src/pages/UnifiedEditor/`. `shell/settings.css.ts` also defines `desktop` (769px), `narrow` (900px) and `cramped` (560px). `prefers-reduced-motion` is written out in 16 files. The app has about 150 literal `@media` keys in 31 style files.

At a viewport 768px wide the Dock uses its desktop styles while the rest of the editor uses its phone styles. Check whether this is visible before migrating, and record the result in the PR.

**Steps.**

1. Read how the JS side decides "phone" (`core/hooks/isMobile`, and any `matchMedia` call in `pages/UnifiedEditor`). The CSS and JS breakpoints must be one constant.
2. Add `apps/codeimage/src/theme/media.ts` exporting the queries: `phone`, `desktop`, `narrow`, `cramped`, `reducedMotion`, and any other query found in step 3. Export the pixel values too, for the JS side.
3. Replace every local definition and every literal `@media` key in `apps/codeimage/src/**/*.css.ts` with an import.
4. Add the lint rule `codeimage/no-literal-media-query`: in a `.css.ts` file, a key inside an `'@media'` object must be a computed key that references an import, not a string literal. Allow literals only in `theme/media.ts`.

**Decision.** Whether the phone breakpoint is `max-width: 768px` or `767px`.

**Done when.** No `.css.ts` file outside `theme/media.ts` contains `max-width`, `min-width` or `prefers-reduced-motion`, and the new rule has no baseline entries.

### A2. Stacking scale

**Today.** Twelve `zIndex` values in 27 style files: 1, 2, 3, 10, 30, 40, 41, 44, 50, 100, 101, 999.

**Steps.**

1. List each use with the element it lifts and what it must sit above or below. Group them into local stacking (1 to 3, inside one component) and app layers (10 and up).
2. Add named layers to `apps/codeimage/src/theme/layers.ts`, for example `canvasControls`, `dock`, `overlay`, `dialog`, `toast`, `whatsNew`. Local stacking keeps small literals.
3. Replace the app-layer literals. Check the order against Kobalte portals and `@codeui/kit` dialogs, which set their own values.
4. Add a lint rule that rejects a `zIndex` literal of 10 or more in a `.css.ts` file outside `theme/layers.ts`.

**Decision.** The layer names and their order.

**Done when.** A dialog, a popover opened from the Dock, the What's new nudge and a toast stack correctly in both layouts, and no app-layer literal remains.

### A3. Motion tokens

**Today.** About ten duration and easing pairs for the same kind of transition: `160ms ${easeOut}` (11 uses), `150ms ease-out` (8), `.2s` (8), `200ms ${ease}` (5), `0.2s ease-in-out` (5), `200ms ease-out` (4), `120ms ease` (4), and more.

**Steps.**

1. Find where `easeOut` and `ease` are defined today and how many files redefine them.
2. Add `apps/codeimage/src/theme/motion.ts` with durations (`fast`, `base`, `slow`) and curves (`easeOut`, `easeInOut`), and helper strings for the common pairs.
3. Migrate the transitions. A change of 10 to 40 ms is expected; a change of curve needs a look in the browser.
4. Add a lint rule that rejects a duration literal (`/\d+m?s/`) in `transition` and `animation` values outside `theme/motion.ts`. Keyframe illustrations in `components/WhatsNew/illustrations.css.ts` need their own timings, so exempt that file by override.

**Decision.** The duration steps. The `emil-design-eng` and `animate` skills give defaults to start from.

### A4. Radii

**Today.** `'6px'` appears 21 times, `'12px'`, `'10px'` and `'2px'` 8 times each, `'18px'` and `'3px'` 7 times each.

**Steps.**

1. Compare these with `themeVars.borderRadius` from `@codeimage/ui`. Use the existing token where the value matches.
2. For values with no token, decide whether the design wants them. `DESIGN.md` describes the islands; add the island radius there if it is missing.
3. Migrate. No lint rule: `'50%'` and `'999px'` are legitimate literals, so a rule would need too many exceptions.

### A5. Shared focus ring and island surface

**Today.** Focus styles take 58 lines in 23 files. The island look (background, border, radius, padding, shadow) is rebuilt in each layout file.

**Steps.**

1. Add `apps/codeimage/src/theme/focus.css.ts` with one `focusRing` style, composed with `style([focusRing, {...}])`.
2. Add an `island` style or `recipe` (variants for density and elevation) beside it.
3. Replace the copies. This removes several `globalStyle` calls of the form `${root} button:focus-visible`, so do it before Workstream B.

## Workstream B: remove `globalStyle`

149 calls in 23 files. The rule `codeimage/no-global-style` already rejects new ones.

| File (under `apps/codeimage/src/`)                      | Calls |
| ------------------------------------------------------- | ----- |
| `components/WhatsNew/illustrations.css.ts`              | 55    |
| `components/WhatsNew/whats-new.css.ts`                  | 16    |
| `pages/UnifiedEditor/variants/dock/dock.css.ts`         | 14    |
| `components/Animation/AnimatePanel.css.ts`              | 12    |
| `pages/UnifiedEditor/variants/sidebar/accordion.css.ts` | 10    |
| `pages/UnifiedEditor/shell/settings.css.ts`             | 9     |
| 17 more files                                           | 33    |

Each call falls into one of four groups, with a fixed rewrite:

| Group                              | Example                                  | Rewrite                                                                                      |
| ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Unclassed tag styled from a parent | `${dots} > i`, `${tabs} span`            | Give the element its own `style()` class and set it in the JSX                               |
| Child under a parent state         | `${row}[data-picture] ${rowTitle}`       | In the child: `selectors: {[`${row}[data-picture] &`]: {...}}`. The parent is declared first |
| `@codeui/kit` or Kobalte internals | `${island} [data-cui="button"]`          | See B3                                                                                       |
| Document-wide                      | scrollbar, `[data-codeimage-theme=dark]` | Move to `theme/global.css.ts`, the one file the rule allows                                  |

### B1. Small files first

The 17 files with one to four calls. One PR per folder (`components/Animation`, `pages/UnifiedEditor/controls`, `pages/UnifiedEditor/shell`, `pages/UnifiedEditor/variants/sidebar`).

### B2. Layout and panel files

`dock.css.ts`, `accordion.css.ts`, `settings.css.ts`, `AnimatePanel.css.ts`, one PR each. These files are also over 300 lines, so split them in the same PR (see C1).

### B3. Kit internals

**Decision.** How the app restyles `@codeui/kit` controls. Three options, in order of preference:

1. The kit control reads a CSS variable, and the island sets it. This needs a `createVar` contract and may need a change in `@codeui/kit` or its patch in `patches/@codeui__kit.patch`.
2. A wrapper in `apps/codeimage/src/ui/` owns the override once, as `SegmentedField` already does for the segmented control. The `globalStyle` call lives in the wrapper's style file with an approved exception.
3. Allow `globalStyle` when the selector contains `[data-cui=` or `[role=`, by a rule option.

List the 15 to 20 calls of this group with the control each one targets before choosing.

### B4. What's new illustrations

`illustrations.css.ts` has 55 calls and 1133 lines. It draws small scenes with unclassed `i`, `b` and `span` elements. Rewrite it scene by scene, one style file per scene, with `styleVariants` for the repeated tiles. Compare each scene with a screenshot at rest and at the end of its motion.

**Done when (workstream).** `codeimage/no-global-style` has no baseline entries outside approved exceptions.

## Workstream C: file and function size

54 files are over 300 lines and 82 functions are over 150.

### C1. Largest app files

| File (under `apps/codeimage/src/`)                              | Lines       | How to split                                                                      |
| --------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `components/WhatsNew/illustrations.css.ts`                      | 1133        | Per scene, with B4                                                                |
| `pages/UnifiedEditor/shell/sections.tsx`                        | 997         | One file per settings section in `shell/sections/`, with an index that lists them |
| `pages/UnifiedEditor/model.tsx`                                 | 711         | Separate the model's state, its derived values and its actions                    |
| `pages/UnifiedEditor/shell/settings.css.ts`                     | 602         | Per part: shell, navigation, rows, controls                                       |
| `pages/UnifiedEditor/agent-tools/tools.ts`                      | 605         | One file per tool group                                                           |
| `pages/UnifiedEditor/variants/dock/dock.css.ts` and `index.tsx` | 456 and 504 | Bar, sheet and pickers                                                            |
| `pages/UnifiedEditor/shell/export-animation-dialog.tsx`         | 560         | Format fields, estimate and progress as components                                |
| `components/WhatsNew/illustrations.tsx`                         | 551         | Per scene, with B4                                                                |
| `pages/UnifiedEditor/controls/SignatureFields.tsx`              | 478         | Profile, layout and style field groups                                            |

Sizes are from `lint-baseline.json` and skip blank lines and comments. A split is a move: no behaviour change, the unit tests stay green, and the PR diff shows moved lines only. Follow the older layout of `components/`: a PascalCase folder per component with `Component.tsx` and `Component.css.ts`.

### C2. Scripts

The largest files are verification scripts: `.agents/skills/verify-codeimage/scripts/audit.mjs` (2625 lines), `scripts/parity/rasterizers.ts` (1392), `local-ai.mjs` (1246), `scripts/parity/animation-gif.ts` (1197).

**Decision.** Whether the 300-line limit applies to verification scripts. If not, turn `max-lines` and `max-lines-per-function` off for `.agents/**` and `scripts/**` in `.oxlintrc.json` and drop their entries. If yes, split `audit.mjs` into one module per feature page under `features/`.

### C3. Long functions, depth and nested ternaries

Do these with the file split that touches them, not as their own pass. A Solid component over 150 lines usually holds two or three components.

## Workstream D: comments

2022 comments in 325 files.

1. Delete commented-out code first. `components/Toolbar/GenerateLinkButton.tsx` (70) and `components/FeatureBadge/compatibility/types.ts` (60) lead the list and predate the 2026 work, so check what they hold.
2. For the rest, go folder by folder. A comment that restates the code is deleted. A comment that explains a browser, Kobalte or Takumi quirk holds knowledge: move it to the PR body, and if a future change could undo the workaround, cover it with an audit case in the `verify-codeimage` skill or a unit test.

**Decision.** Whether quirk comments may stay under an approved exception, or whether a `// why:` prefix should be allowed by the rule. Today the rule allows only tool directives.

## Workstream E: other baseline debt

| Step | Rule                                 | Work                                                                                                                                                       |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1   | `no-restricted-imports`              | Replace the 84 relative imports with `@codeimage/store`, `@core` and `@ui`. Mechanical, one PR                                                             |
| E2   | `unused-disable-directive`           | Delete the 28 directives that suppress nothing. Mechanical, one PR                                                                                         |
| E3   | `codeimage/disable-directive-format` | For each of the remaining directives, fix the code or write the reason, date and approver                                                                  |
| E4   | `solid/reactivity`                   | 37 warnings in 21 files. Each one is either a real lost update or a false positive. Fix the real ones; the false ones get an approved exception            |
| E5   | `import/no-cycle`                    | 19 cycles, most through `core/configuration/terminal-themes.ts` and `state/editor/terminal.ts`. Move the shared types to a module both sides import        |
| E6   | `no-non-null-assertion`              | 140 uses. Start with non-test files                                                                                                                        |
| E7   | `codeimage/no-document-query`        | 36 uses. Replace with refs or a store. `index.tsx` (3) and the `verify-*` scripts may keep theirs under an exception                                       |
| E8   | `codeimage/no-static-inline-style`   | 31 uses, 8 of them in `WhatsNew/illustrations.tsx`. Do with B4                                                                                             |
| E9   | `codeimage/no-global-key-listener`   | `CommandMenu.tsx` and `ShortcutHelp.tsx`. Move to `useHotkey`, keeping capture order: the hotkeys on `document.body` run before Solid's delegated handlers |

## Workstream F: checks that do not exist yet

`AGENTS.md` lists these under "Not enforced yet".

### F1. Unused exports and dependencies

Corrected in 38c232d0, 1a5199a4, c7b8c46f, a6a2dc26 and 081ade68. Add `knip` as a root dev dependency with a workspace config, record today's findings in a baseline the same way as lint, and run it in the Lint job. Entry points to declare: the Vite entries, the service worker, `src/workers/`, the TanStack route tree, the API's autoloaded route plugins and the CLI.

### F2. Path aliases for the rest of the app

`i18n`, `components` and `hooks` have no alias, so the app has about 200 imports that climb three or more folders. **Decision:** add `@app/*` for `src/*` in `tsconfig.json` and the Vite config, or leave it. With an alias, extend `no-restricted-imports` to reject `../../../`.

### F3. Lockfile and formatter churn

Corrected in e6855b25 and f3ad0ea3. Add a CI step that fails when `pnpm-lock.yaml` changes in a PR whose `package.json` and `pnpm-workspace.yaml` files do not. Add `pnpm format:check` to the Lint job once the files that are not `oxfmt`-clean today are formatted in one PR.

### F4. Typecheck for scripts

`scripts/` and `.agents/skills/verify-codeimage/scripts/` have no `tsconfig`. Add one for `scripts/**/*.ts` with `checkJs` for the `.mjs` files, and a `typecheck` step in CI.

### F5. Legacy verification scripts

Nine scripts are listed as exceptions in `scripts/check-structure.mjs`. Port `verify-review.mjs`, `verify-i18n.mjs` and `verify-locale-parity.mjs` to audit cases of the skill and delete them. Decide per `scripts/verify-p5-*.cjs` file whether `references/legacy-checks.md` still needs it.

## Workstream G: layout theme contract

Do this last. It depends on A5 and B3.

Sidebar and Dock are two skins of the same controls. Define a `createThemeContract` for the editor chrome (island background, border, radius, padding, row height, control height, gap) in `apps/codeimage/src/theme/chrome.css.ts`. Each layout applies its values with `createTheme` on its root, and the shared controls read the variables. A third layout or a density setting then needs a new set of values and no new selectors.

**Decision.** The list of variables, taken from what differs today between `dock.css.ts` and the Sidebar style files. Build the list by diffing the two before writing the contract. A token invented for a value that appears once adds a name and removes nothing.

## Suggested order

1. E1 and E2. Mechanical, and they shrink the baseline before larger PRs conflict with it.
2. A1, then A2 and A3 once their decisions are made.
3. A5, then B1 and B2 with the C1 splits of the same files.
4. C1 for `sections.tsx` and `model.tsx`.
5. F1 and F3.
6. B3, B4, then G.
7. D and the rest of E alongside, folder by folder, whenever a folder is otherwise quiet.
