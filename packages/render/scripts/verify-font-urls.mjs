import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fontManifestSchema} from '../src/fontManifest.ts';

const manifest = fontManifestSchema.parse(
  JSON.parse(
    await readFile(
      process.argv[2] ??
        new URL('../dist/fonts/manifest.json', import.meta.url),
      'utf8',
    ),
  ),
);
const files = manifest.fonts
  .flatMap(font => font.files)
  .filter(file => file.url);
let next = 0;
await Promise.all(
  Array.from({length: 6}, async () => {
    while (next < files.length) {
      const file = files[next++];
      const response = await fetch(file.url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`${response.status}: ${file.url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (
        bytes.length !== file.bytes ||
        createHash('sha256').update(bytes).digest('hex') !== file.sha256
      )
        throw new Error(`Integrity mismatch: ${file.url}`);
    }
  }),
);
console.error(
  `Verified ${files.length} immutable font URLs and SHA-256 hashes.`,
);
