import type {FontLoader} from '@takumi-rs/core';

import type {CatalogFile, CatalogFont, FontManifest} from './fontManifest';

export function createFontResources(
  catalog: FontManifest,
  bytes: (font: CatalogFont, file: CatalogFile) => Promise<Buffer>,
  code?: CatalogFont,
) {
  const selected = catalog.fonts.filter(
    font => font.role !== 'code' || font === code,
  );
  const held = new Map<CatalogFile, Promise<Buffer>>();
  const data = (font: CatalogFont, file: CatalogFile) => {
    let value = held.get(file);
    if (!value) {
      value = bytes(font, file);
      held.set(file, value);
    }
    return value;
  };
  const loaderOf = new Map<CatalogFile, FontLoader>();
  const loaders = selected.flatMap(font =>
    font.files.map(file => {
      const loader = {
        key: `${font.family}/${file.sha256}/${file.weight ?? 'variable'}`,
        name: font.family,
        weight: file.weight,
        unicodeRange: file.unicodeRange,
        data: () => data(font, file),
      };
      loaderOf.set(file, loader);
      return loader;
    }),
  );

  const primaries = selected
    .filter(font => font.role !== 'fallback')
    .flatMap(font => {
      const spaces = font.files.filter(file =>
        file.unicodeRange.some(([start, end]) => start <= 0x20 && end >= 0x20),
      );
      const file =
        spaces.find(file => (file.weight ?? 400) === 400) ?? spaces[0];
      const loader = file && loaderOf.get(file);
      return loader ? [loader] : [];
    });
  return {
    loaders,
    primaries,
    async faces() {
      return Promise.all(
        selected.flatMap(font =>
          font.files
            .filter(file => held.has(file) || (font.role === 'ui' && !file.url))
            .map(async file => ({
              family: font.family,
              file: file.file,
              data: await data(font, file),
              weight: file.weight,
              unicodeRange: file.unicodeRange,
            })),
        ),
      );
    },
  };
}
