import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Renderer} from '@takumi-rs/core';

const width = 14;
const height = 14;
const supersampling = 8;
const source = await readFile(
  new URL(
    '../../../apps/website/public/brand/codeimage-logo-blue-svg-v1.svg',
    import.meta.url,
  ),
  'utf8',
);
const defs = source.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
const shapes = source.match(
  /<(?:rect|path)\b[^>]*\bid="(?:logo-container|c-shape-[1-5])"[^>]*\/>/g,
);
if (!defs || shapes?.length !== 6) {
  throw new Error(
    'Expected the CodeImage gradient, square and five slanted bars',
  );
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 183.56 183.56">${defs}${shapes.join('')}</svg>`;
const renderer = new Renderer();
const pixels = await renderer.render(
  {
    type: 'image',
    src: 'logo',
    style: {width: width * supersampling, height: height * supersampling},
  },
  {
    width: width * supersampling,
    height: height * supersampling,
    format: 'raw',
    images: [{src: 'logo', data: Buffer.from(svg)}],
  },
);
const png = await renderer.render(
  {type: 'image', src: 'logo', style: {width: 96, height: 96}},
  {
    width: 96,
    height: 96,
    format: 'png',
    images: [{src: 'logo', data: Buffer.from(svg)}],
  },
);
const color = (x, y) => {
  const channels = [0, 0, 0];
  let coverage = 0;
  for (let dy = 0; dy < supersampling; dy++) {
    for (let dx = 0; dx < supersampling; dx++) {
      const offset =
        ((y * supersampling + dy) * width * supersampling +
          x * supersampling +
          dx) *
        4;
      const alpha = pixels[offset + 3] / 255;
      coverage += alpha;
      for (let channel = 0; channel < 3; channel++) {
        channels[channel] += pixels[offset + channel] * alpha;
      }
    }
  }
  return {
    coverage: coverage / supersampling ** 2,
    rgb: channels
      .map(channel => Math.round(channel / (coverage || 1)))
      .join(';'),
  };
};
const rows = [];
for (let y = 0; y < height; y += 2) {
  let row = '';
  let previous = '';
  for (let x = 0; x < width; x++) {
    const top = color(x, y);
    const bottom = color(x, y + 1);
    const halves = Math.round(top.coverage + bottom.coverage);
    const solid = halves === 2;
    const upper = top.coverage >= bottom.coverage;
    const foreground = solid ? top : upper ? top : bottom;
    const style = `\x1b[${halves ? `38;2;${foreground.rgb}` : '39'};${solid ? `48;2;${bottom.rgb}` : '49'}m`;
    if (style !== previous) row += style;
    previous = style;
    row += halves ? (solid || upper ? '▀' : '▄') : ' ';
  }
  row += '\x1b[0m';
  if (y === 6) row += '  \x1b[1mCodeImage\x1b[0m';
  rows.push(row);
}
const output = new URL('../src/help-logo.ts', import.meta.url);
await writeFile(
  output,
  `export const HELP_LOGO_COLUMNS = ${width};\nexport const HELP_LOGO_ROWS = ${height / 2};\nexport const HELP_LOGO_PNG = '${png.toString('base64')}';\nexport const HELP_LOGO = [\n${rows.map(row => `  ${JSON.stringify(row).replaceAll('\\u001b', '\\x1b')},`).join('\n')}\n].join('\\n');\n`,
);
const formatted = spawnSync('pnpm', ['exec', 'oxfmt', fileURLToPath(output)], {
  stdio: 'inherit',
});
if (formatted.status !== 0) process.exit(formatted.status ?? 1);
