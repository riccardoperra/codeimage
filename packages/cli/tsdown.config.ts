import {defineConfig} from 'tsdown';
import type {SUPPORTED_LANGUAGES as ConfigLanguages} from '@codeimage/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  entry: ['src/bin.ts'],
  platform: 'node',
  format: 'esm',
  fixedExtension: false,
  alias: {
    '@codeimage/highlight/themes': fileURLToPath(
      new URL('../highlight/src/lib/themes/index.ts', import.meta.url),
    ),
  },
  deps: {
    neverBundle: ['@codeimage/render'],
    alwaysBundle: [/@codeimage\/highlight/, /@primer\/primitives/],
  },
  plugins: [
    {
      name: 'language-metadata',
      resolveId(id) {
        if (id === '@codeimage/config') return '\0cli-languages';
      },
      async load(id) {
        if (id !== '\0cli-languages') return;
        const {
          SUPPORTED_LANGUAGES,
        }: {SUPPORTED_LANGUAGES: typeof ConfigLanguages} = await import(
          new URL('../config/src/lib/base/languages.ts', import.meta.url).href
        );
        const languages = SUPPORTED_LANGUAGES.map(
          language => `{
        id: ${JSON.stringify(language.id)},
        icons: [${language.icons.map(icon => `{matcher: ${icon.matcher.toString()}}`).join(',')}]
      }`,
        );
        return `export const SUPPORTED_LANGUAGES = [${languages.join(',')}];`;
      },
    },
  ],
  clean: true,
  sourcemap: true,
});
