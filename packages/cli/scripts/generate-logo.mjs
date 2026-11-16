import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Renderer} from '@takumi-rs/core';

const width = 20;
const height = 18;
const source = await readFile(
  new URL('../../../apps/codeimage/src/assets/favicon.svg', import.meta.url),
  'utf8',
);
const svg = source
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace('<svg ', '<svg fill="#3b82f6" ');
const pixels = await new Renderer().render(
  {type: 'image', src: 'logo', style: {width, height}},
  {
    width,
    height,
    format: 'raw',
    images: [{src: 'logo', data: Buffer.from(svg)}],
  },
);
const color = (x, y) => {
  const offset = (y * width + x) * 4;
  return pixels[offset + 3] >= 128
    ? [...pixels.subarray(offset, offset + 3)].join(';')
    : undefined;
};
const rows = [];
for (let y = 0; y < height; y += 2) {
  let row = '';
  let previous = '';
  for (let x = 0; x < width; x++) {
    const top = color(x, y);
    const bottom = color(x, y + 1);
    const foreground = top ?? bottom;
    const background = top && bottom ? bottom : undefined;
    const style = `\x1b[${foreground ? `38;2;${foreground}` : '39'};${background ? `48;2;${background}` : '49'}m`;
    if (style !== previous) row += style;
    previous = style;
    row += top ? '▀' : bottom ? '▄' : ' ';
  }
  row += '\x1b[0m';
  if (y === 8) row += '  \x1b[1mCodeImage\x1b[0m';
  rows.push(row);
}
const output = new URL('../src/help-logo.ts', import.meta.url);
await writeFile(
  output,
  `export const HELP_LOGO = [\n${rows.map(row => `  ${JSON.stringify(row).replaceAll('\\u001b', '\\x1b')},`).join('\n')}\n].join('\\n');\n`,
);
const formatted = spawnSync('pnpm', ['exec', 'oxfmt', fileURLToPath(output)], {
  stdio: 'inherit',
});
if (formatted.status !== 0) process.exit(formatted.status ?? 1);
