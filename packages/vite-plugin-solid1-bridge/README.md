# Vite plugin for Solid 1 components in a Solid 2 client build

Enable the plugin alongside the Solid 2 compiler. Use a separate dependency root where `solid-js` resolves to Solid 1 and the legacy component packages resolve from that same root.

```js
import {solid1Bridge} from '@codeimage/vite-plugin-solid1-bridge';

solid1Bridge({
  entries: ['src/Actions.tsx'],
  modules: {
    '@codeui/kit': {standalone: ['Button'], compound: ['DropdownMenu']},
    '@kobalte/core/dropdown-menu': {compound: ['DropdownMenu', 'Root']},
  },
  legacy: {root: legacyPackageRoot, plugins: [legacySolidCompiler()]},
});
```

`entries` names source files relative to the Vite root. `standalone` replaces named component imports with generated adapters. `compound` moves a root and its JSX subtree together so the parts share their Solid 1 context. `legacyComponents` optionally allows specific additional import specifiers in those subtrees. Add the legacy project's CSS transforms to `legacy.plugins` as needed.

Use `optionalEntries` for Solid 2 files that may have no matching legacy imports. Required `entries` still fail the build when no bridge rule matches.

The plugin provides `virtual:solid1-bridge` for the Solid 2 runtime, builds one shared browser module for generated Solid 1 mounts, and passes legacy CSS through Vite. The default bridge forwards flat props, text children, and callbacks. Compounds capture primitive values and callbacks from the host. Unsupported spreads in compounds, dynamic `as`, and cross-runtime refs require an explicit adapter. Module rules apply to named imports in the configured files.

The plugin supports client builds. It does not transform SSR or provide development HMR. CodeImage's opt-in probe embeds a client build into the existing dashboard's dev or client build.

The TypeScript build emits the package entry point, declarations, and both virtual-module runtimes. Run `pnpm --filter @codeimage/vite-plugin-solid1-bridge build` after changing the plugin.

Run the transform tests with `pnpm --filter @codeimage/vite-plugin-solid1-bridge test`. Run the [CodeImage browser check](../../.agents/skills/verify-codeimage/features/projects.md) to exercise real menu actions with the mock backend.
