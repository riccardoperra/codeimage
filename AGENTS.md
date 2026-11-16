# CodeImage agent rules

Run `pnpm lint` before every push. CI runs the same command in the Lint job. It runs `scripts/check-structure.mjs`, then `scripts/lint.mjs`, which lints the whole repository and compares each file and rule with `lint-baseline.json`.

## How the baseline works

`lint-baseline.json` records the findings that existed when each rule was added. A file fails when it has more findings of a rule than recorded. A file over 300 lines fails when it grows, so move code out before adding to it.

- Fix the code. Do not edit `lint-baseline.json` to make a failure pass.
- When you remove findings, run `pnpm lint:tighten`. It only lowers entries.
- When you move or rename a file, move its entry in `lint-baseline.json` in the same commit.
- Only the operator runs `node scripts/lint.mjs --accept`, which records new findings.

## Exceptions

An exception goes on the offending line and the operator approves it in review:

```ts
// oxlint-disable-next-line <rule> -- <reason>, expires YYYY-MM-DD, approved by <name>
```

`codeimage/disable-directive-format` fails a directive without these three parts and fails it again after the date.

## Rules and what enforces them

| Rule                                                                                                                                                | Enforced by                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Write no code comments. Put the rationale in the commit message or the PR body.                                                                     | `codeimage/no-comments`                                                 |
| Keep a source file under 300 lines and a function under 150. Tests and i18n dictionaries are exempt.                                                | `max-lines`, `max-lines-per-function`                                   |
| Keep nesting to 4 levels, parameters to 4 and complexity to 20. Do not nest ternaries.                                                              | `max-depth`, `max-params`, `complexity`, `no-nested-ternary`            |
| Do not use `!` to assert a value exists. Narrow the type.                                                                                           | `@typescript-eslint/no-non-null-assertion`                              |
| Do not create import cycles.                                                                                                                        | `import/no-cycle`                                                       |
| Do not leave `console.log` in shipped code. `console.warn` and `console.error` are allowed.                                                         | `no-console`                                                            |
| A new Solid reactivity warning fails lint.                                                                                                          | `solid/reactivity`, `solid/components-return-once` through the baseline |
| In the app, import only types from `@codeimage/api`. CI builds the app before the API.                                                              | `no-restricted-imports` in `apps/codeimage/.oxlintrc.json`              |
| In the app, import `state/`, `core/` and `ui/` through `@codeimage/store/*`, `@core/*` and `@ui/*`.                                                 | `no-restricted-imports` in `apps/codeimage/.oxlintrc.json`              |
| Editor layouts under `pages/UnifiedEditor/variants/` do not import What's new. They render shared controls.                                         | `no-restricted-imports` override in `apps/codeimage/.oxlintrc.json`     |
| Register app-wide keys with `useHotkey` and guard them with `isKeyOwnedByFocus` from `apps/codeimage/src/hooks/use-hotkey.ts`.                      | `codeimage/no-global-key-listener`                                      |
| Reach an element through a ref, a prop or a store, not `document.querySelector`.                                                                    | `codeimage/no-document-query`                                           |
| Put constant styles in a vanilla-extract `.css.ts` file. The `style` prop is for computed values.                                                   | `codeimage/no-static-inline-style`                                      |
| Style an element through its own `style()` class, with `selectors`, `styleVariants` or `recipe`. `globalStyle` is only for `theme/global.css.ts`.   | `codeimage/no-global-style`                                             |
| Write app and UI kit styles in `.css.ts`, never plain CSS or SCSS.                                                                                  | `scripts/check-structure.mjs`                                           |
| Add browser checks as cases of `.agents/skills/verify-codeimage/scripts/audit.mjs`. Do not add `verify-*` or `capture-*` scripts to source folders. | `scripts/check-structure.mjs`                                           |
| Do not commit backup or leftover files (`.bak`, `.orig`, `.rej`, `.tmp`).                                                                           | `scripts/check-structure.mjs`                                           |
| A lint exception carries a reason, an expiry date and an approver.                                                                                  | `codeimage/disable-directive-format`                                    |

The custom rules live in `tools/oxlint-plugin-codeimage/rules/`.

## Not enforced yet

Nothing fails when these are skipped. Each one has been corrected more than once, so the next correction should add a check.

- Delete exports, props and translations that nothing reads (38c232d0, 1a5199a4, c7b8c46f, a6a2dc26).
- Do not commit `pnpm-lock.yaml` or formatter changes unrelated to the task (e6855b25, f3ad0ea3). Call binaries in `node_modules/.bin` directly, because `pnpm exec` can rewrite the lockfile.
- Give every icon button and field an accessible name (73d467c6, f9926590, 2656aedd).
- Format only the files you touch with `oxfmt`. The repository does not use Prettier.

## When the operator corrects you

Fix the mistake and add its rule to the table. If the rule was already in "Not enforced yet", add the check in the same change. Remove a rule once its mistake cannot happen.
