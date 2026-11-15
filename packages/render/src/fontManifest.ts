import {readFileSync} from 'node:fs';
import {z} from 'zod';

const range = z
  .tuple([
    z.number().int().min(0).max(0x10ffff),
    z.number().int().min(0).max(0x10ffff),
  ])
  .refine(([start, end]) => start <= end);
export const fontFileSchema = z.object({
  file: z.string().regex(/^[^/\\]+\.(woff2?|ttf|otf)$/),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  weight: z.number().int().positive().optional(),
  unicodeRange: z.array(range).nonempty(),
  declaredRange: z.array(range).optional(),
  url: z
    .url()
    .refine(url => url.startsWith('https://'))
    .nullable(),
});
export const fontManifestSchema = z.object({
  schema: z.literal(1),
  fonts: z
    .array(
      z.object({
        id: z.string().min(1),
        family: z.string().min(1),
        label: z.string().min(1),
        role: z.enum(['ui', 'code', 'fallback']),
        source: z.string().min(1),
        files: z.array(fontFileSchema).nonempty(),
      }),
    )
    .refine(fonts => new Set(fonts.map(font => font.id)).size === fonts.length),
});
export type CatalogFile = z.infer<typeof fontFileSchema>;
export type CatalogFont = z.infer<typeof fontManifestSchema>['fonts'][number];
export type FontManifest = z.infer<typeof fontManifestSchema>;
export const fontsDir = new URL('../dist/fonts/', import.meta.url);
let catalog: FontManifest | undefined;
export function loadFontCatalog(): FontManifest {
  return (catalog ??= fontManifestSchema.parse(
    JSON.parse(readFileSync(new URL('manifest.json', fontsDir), 'utf8')),
  ));
}
export function findFont(catalog: FontManifest, id: string): CatalogFont {
  const font = catalog.fonts.find(
    font => font.id.toLowerCase() === id.toLowerCase(),
  );
  if (!font)
    throw new Error(
      `Unknown font "${id}". Valid ids: ${catalog.fonts.map(font => font.id).join(', ')}`,
    );
  return font;
}

export function resolveFontId(id: string): string {
  const catalog = loadFontCatalog();
  return findFont(
    {...catalog, fonts: catalog.fonts.filter(font => font.role === 'code')},
    id,
  ).id;
}
