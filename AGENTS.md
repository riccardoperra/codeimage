# Working on CodeImage

Read these before changing the editor:

- [`DESIGN.md`](DESIGN.md): the design decisions, and how editor code works with CodeMirror (section "The code editor").
- [`apps/codeimage/src/pages/UnifiedEditor/README.md`](apps/codeimage/src/pages/UnifiedEditor/README.md): how the unified editor is built.
- `docs/plans/`: the plan of the feature you are working on, when there is one.

## Setup and checks

- Use Node 24 (`fnm exec --using=v24.14.0 <command>`). Vite does not start on older versions.
- Install with `pnpm install --frozen-lockfile`, then run `pnpm libs:build` before the first typecheck. The app imports the built `@codeimage/*` packages.
- App typecheck: `./node_modules/.bin/tsc --noEmit -p tsconfig.json` in `apps/codeimage`. Unit tests: `./node_modules/.bin/vitest run` there.
- Format with oxfmt (`pnpm format`, or `node_modules/.bin/oxfmt <files>` for the files you touched), never prettier. Lint with oxlint.
- Check behaviour in the browser with the `verify-codeimage` skill in `.agents/skills/verify-codeimage/`. New checks go there as audit cases, not as `verify-*.mjs` files in source folders.

## Code

- Do not add code comments. Explain the change in the commit message or the pull request.
- Styles are vanilla-extract `.css.ts` files with tokens from `@codeimage/ui`. A `style()` selector must target `&`; child selectors go in `globalStyle`.
- Use the `@codeui/kit` components (Button, IconButton, Tooltip, Popover, DropdownMenu, SegmentedField) before building a control by hand.
- Every visible string goes through the locale files, in English, Italian, German and Spanish.
- The editor is CodeMirror 6. Change it through decorations, gutter markers, tooltips and CodeMirror event handlers, never by editing or querying its DOM.
- A native `on:keydown` that calls `stopPropagation` also stops Solid's delegated handlers below it. Use it only around text fields.
- A new API field must be named in its TypeBox schema, because fast-json-stringify drops unnamed fields, and accepted by the parser in `apps/api/src/modules/project/project.model.ts`.

## Commits

Conventional commits. The scope, when present, is one of `app`, `ui`, `highlight`, `config`, `locale`, `dom-export`, `vanilla-extract`, `api`, `website` (see `commitlint.config.js`).
