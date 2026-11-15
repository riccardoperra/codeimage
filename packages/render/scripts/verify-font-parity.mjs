import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {
  createRenderer,
  openFontCache,
  supportedFontIds,
} from '../dist/index.mjs';
import {sampleDocument} from '../src/sample.ts';

const baseline = await import(pathToFileURL(process.argv[2]).href);
const cacheDir = process.env.CODEIMAGE_CACHE_DIR;
await openFontCache({cacheDir}).install('all');
const renderer = createRenderer({cacheDir, offline: true});
let count = 0;
for (const fontId of await supportedFontIds()) {
  for (const weight of [400, 500, 600, 700]) {
    const document = {
      ...sampleDocument,
      editor: {
        options: {...sampleDocument.editor.options, fontId, fontWeight: weight},
        editors: [
          {
            ...sampleDocument.editor.editors[0],
            code: 'const answer = 42; // ffi → ✓\n你好 カタカナ 안녕 Привет 🎉 🇮🇹 👨‍👩‍👧 1️⃣',
          },
        ],
      },
    };
    assert.deepEqual(
      await renderer.render(document),
      await baseline.renderSnapshot(document),
      `${fontId} weight ${weight}`,
    );
    count++;
  }
}
console.error(`${count} cache-backed PNGs byte-identical to P10.`);
