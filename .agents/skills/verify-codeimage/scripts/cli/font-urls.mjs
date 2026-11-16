#!/usr/bin/env node
import {fontManifestSchema} from '../../../../../packages/render/src/fontManifest.ts';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const manifest = fontManifestSchema.parse(
  JSON.parse(
    await readFile(
      process.argv[2] ??
        new URL(
          '../../../../../packages/render/dist/fonts/manifest.json',
          import.meta.url,
        ),
      'utf8',
    ),
  ),
);
export const files = manifest.fonts
  .flatMap(font => font.files)
  .filter(file => file.url);
export let next = 0;
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
