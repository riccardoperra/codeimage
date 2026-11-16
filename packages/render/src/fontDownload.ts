import {setTimeout as delay} from 'node:timers/promises';

import type {CatalogFile, CatalogFont} from './fontManifest';

import {FontUnavailableError} from './fontCacheTypes';
import type {FontCacheOptions, FontEvent} from './fontCacheTypes';
import {valid} from './fontCacheStorage';
import type {createCacheStorage} from './fontCacheStorage';
async function readResponse(
  response: Response,
  file: CatalogFile,
  font: CatalogFont,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty font response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > file.bytes)
        throw new FontUnavailableError(
          font.id,
          'integrity',
          `download exceeds pinned size (${file.url})`,
        );
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks);
}
export function createFontDownloader(
  options: FontCacheOptions & {fetch?: typeof fetch},
  publish: ReturnType<typeof createCacheStorage>['publish'],
) {
  let active = 0;
  const waiting: (() => void)[] = [];
  const emit = (event: FontEvent) => options.onEvent?.(event);
  async function download(font: CatalogFont, file: CatalogFile, url: string) {
    if (active >= 6) await new Promise<void>(resolve => waiting.push(resolve));
    else active++;
    emit({
      type: 'download',
      fontId: font.id,
      label: font.label,
      file: file.file,
      bytes: file.bytes,
    });
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const signal = AbortSignal.any([
            AbortSignal.timeout(30_000),
            ...(options.signal ? [options.signal] : []),
          ]);
          const response = await (options.fetch ?? fetch)(url, {signal});
          checkResponse(response, font, file);
          const bytes = await readResponse(response, file, font);
          if (!valid(bytes, file))
            throw new FontUnavailableError(
              font.id,
              'integrity',
              `SHA-256 or size mismatch; nothing cached (${file.url})`,
            );
          await publish(bytes, file);
          emit({
            type: 'downloaded',
            fontId: font.id,
            label: font.label,
            file: file.file,
            bytes: bytes.length,
          });
          return bytes;
        } catch (error) {
          if (error instanceof FontUnavailableError) throw error;
          if (attempt >= 2 || options.signal?.aborted)
            throw new FontUnavailableError(
              font.id,
              'network',
              `download failed (${file.url})`,
              {cause: error},
            );
          await delay(250 * 2 ** attempt, undefined, {signal: options.signal});
        }
      }
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  }

  return download;
}

function checkResponse(
  response: Response,
  font: CatalogFont,
  file: CatalogFile,
) {
  if (response.ok) return;
  if (response.status < 500 && response.status !== 429)
    throw new FontUnavailableError(
      font.id,
      'network',
      `HTTP ${response.status} from ${file.url}`,
    );
  throw new Error(`HTTP ${response.status}`);
}
