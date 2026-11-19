# CodeUI Button and Dropdown in a Solid 2 host

This demo uses the workspace [Vite bridge package](../../../../packages/vite-plugin-solid1-bridge/README.md) and the actual [project actions component](../../../../apps/codeimage/src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu.tsx). It also contains a standalone CodeUI Button and a Dropdown imported directly from Kobalte. The demo supplies sample labels and callbacks. Use the dashboard audit to exercise the real project actions.

Install CodeImage's dependencies with `pnpm install --frozen-lockfile` and run `pnpm libs:build` from the repo root on Node 24. Run these commands in this demo directory with the same Node version.

```sh
npm install --no-package-lock
npm run build
node check.mjs
```

Open `dist/index.html` directly. The Chrome check exercises reactive Button props and callbacks, Dropdown pointer selection, keyboard focus, Escape, translations, portal removal, and remount.
