import {readFile, readdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {highlightingFor} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {tags} from '@lezer/highlight';
import type {CustomTheme} from '../src/lib/core/custom-theme';
import * as themes from '../src/lib/themes';

export function readKeywordColor(theme: CustomTheme): string {
  const state = EditorState.create({extensions: theme.editorTheme});
  const classes = highlightingFor(state, [tags.keyword])?.split(' ') ?? [];
  for (const module of state.facet(EditorView.styleModule)) {
    for (const [, selector, body] of module
      .getRules()
      .matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!classes.some(name => selector.trim() === `.${name}`)) continue;
      const color = /(?:^|[;\s])color\s*:\s*([^;]+)/.exec(body)?.[1].trim();
      if (color) return normalizeColor(color);
    }
  }
  throw new Error(`No keyword colour for ${theme.id}`);
}

function normalizeColor(color: string): string {
  const hsl = /^hsl\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\s*\)$/.exec(color);
  if (!hsl) return color;
  const h = Number(hsl[1]) / 30;
  const s = Number(hsl[2]) / 100;
  const l = Number(hsl[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `rgb(${channel(0)}, ${channel(8)}, ${channel(4)})`;
}

async function generate() {
  const root = pathToFileURL(
    path.resolve(__dirname, '../src/lib/themes') + '/',
  );
  let count = 0;
  for (const path of await readdir(root, {recursive: true})) {
    if (!path.endsWith('.ts')) continue;
    const url = new URL(path, root);
    const source = await readFile(url, 'utf8');
    const name = /export const (\w+) = createTheme\(/.exec(source)?.[1];
    const theme = Object.entries(themes).find(([key]) => key === name)?.[1];
    if (!theme) continue;
    const accent = readKeywordColor(theme);
    const updated = source.replace(
      /(terminal:\s*{\s*\n)(?:\s*accent: [^\n]+\n)?/,
      `$1      accent: '${accent}',\n`,
    );
    if (source !== updated) await writeFile(url, updated);
    count++;
  }
  if (count !== Object.keys(themes).length)
    throw new Error(`Updated ${count} of ${Object.keys(themes).length} themes`);
  console.log(`Generated accents for ${count} themes`);
}

if (require.main === module) {
  generate().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
