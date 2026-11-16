import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const app = (path: string) =>
  fileURLToPath(new URL(`../../apps/codeimage/src/${path}`, import.meta.url));

// animationSettings.test.ts runs the editor's own Animate settings parser,
// which imports through the app's aliases.
export default defineConfig({
  resolve: {alias: {'@core': app('core'), '@codeimage/store': app('state')}},
});
