import {fileURLToPath} from 'node:url';
import {solid1Bridge} from '@codeimage/vite-plugin-solid1-bridge';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import solid1 from 'vite-plugin-solid';

const legacyRoot = fileURLToPath(new URL('./', import.meta.url));
const controls = [
  'Button',
  'Checkbox',
  'IconButton',
  'Link',
  'Listbox',
  'NumberField',
  'Pagination',
  'Select',
  'TextArea',
  'TextField',
  'Tooltip',
  'VirtualizedListbox',
];

export function legacyWidgets() {
  return solid1Bridge({
    entries: ['src/ui/legacy-controls.ts'],
    modules: {
      '@codeui/kit': {
        standalone: controls,
        domProps: controls,
      },
    },
    legacy: {
      root: legacyRoot,
      plugins: [
        {
          name: 'codeimage-legacy-runtime',
          config: () => ({
            resolve: {dedupe: ['solid-js', '@codeui/kit', '@kobalte/core']},
          }),
        },
        vanillaExtractPlugin(),
        solid1(),
      ],
    },
    cssLayer: 'codeimage-legacy-widgets',
  });
}
