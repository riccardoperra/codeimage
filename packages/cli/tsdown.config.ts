import {defineConfig} from 'tsdown';
import type {SUPPORTED_LANGUAGES as ConfigLanguages} from '@codeimage/config';
import {fileURLToPath} from 'node:url';

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const languagesModule = source('../config/src/lib/base/languages.ts');

export default defineConfig({
  entry: ['src/bin.ts'],
  platform: 'node',
  format: 'esm',
  fixedExtension: false,
  alias: {
    '@codeimage/config': source('../config/src/public-api.ts'),
    '@codeimage/highlight/themes': source(
      '../highlight/src/lib/themes/index.ts',
    ),
  },
  deps: {
    alwaysBundle: [
      /@codeimage\/render/,
      /@codeimage\/highlight/,
      /@codeimage\/secrets/,
      /@primer\/primitives/,
    ],
  },
  plugins: [
    {
      name: 'language-metadata',
      async load(id) {
        if (id !== languagesModule) return;
        const {
          SUPPORTED_LANGUAGES,
        }: {SUPPORTED_LANGUAGES: typeof ConfigLanguages} = await import(id);
        const languages = SUPPORTED_LANGUAGES.map(
          language =>
            `{id: ${JSON.stringify(language.id)}, label: ${JSON.stringify(language.label)}, icons: [${language.icons.map(icon => `{matcher: ${icon.matcher}}`).join(', ')}]}`,
        );
        return `export const SUPPORTED_LANGUAGES = [${languages.join(',\n')}];`;
      },
    },
  ],
  clean: true,
  sourcemap: true,
});
