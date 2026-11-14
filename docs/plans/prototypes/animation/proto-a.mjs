import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
const WT = process.env.CODEIMAGE_ROOT ?? new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '');
const OUT = (process.env.OUT_DIR ?? (await import('node:os')).tmpdir()) + '/';
const require = createRequire(WT + '/packages/render/package.json');
const {Renderer} = require('@takumi-rs/core');

const r = new Renderer();
await r.registerFont({name: 'Geist Mono', data: await readFile(WT + '/apps/codeimage/public/assets/fonts/geist_mono/GeistMono[wght].ttf')});

const A = `function add(a, b) {\n  return a + b;\n}`;
const B = `export function add(a: number, b: number) {\n  const sum = a + b;\n  return sum;\n}`;
const FS = 28, LH = FS * 1.4, PAD = 48;
const tok = code => code.split('\n').flatMap((line, y) => {
  const out = []; const re = /\w+|[^\w\s]+/g; let m;
  while ((m = re.exec(line))) out.push({text: m[0], col: m.index, line: y});
  return out;
});
const colorOf = t => /^(function|return|export|const)$/.test(t) ? '#ff79c6' : /^(number)$/.test(t) ? '#8be9fd' : /^\w+$/.test(t) ? '#f8f8f2' : '#bd93f9';

function match(a, b) {
  const n = a.length, m = b.length, dp = Array.from({length: n + 1}, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i].text === b[j].text ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].text === b[j].text) pairs.push([i++, j++]);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return pairs;
}

const probe = await r.measure(`<div style="font-family:'Geist Mono';font-size:${FS}px;display:flex"><span>${'M'.repeat(40)}</span></div>`, {});
const findRuns = n => n.runs.length ? n.runs : n.children.flatMap(findRuns);
const CW = findRuns(probe)[0].width / 40;
console.log('char width', CW);

const ta = tok(A), tb = tok(B), pairs = match(ta, tb);
const ia = new Map(pairs.map(([i, j]) => [i, j])), jb = new Set(pairs.map(p => p[1]));
const W = 1000, H = 360;
const pos = t => ({x: PAD + t.col * CW, y: PAD + t.line * LH});
const T = 900;
let css = '', spans = '';
const span = (t, p, anim) => `<span style="position:absolute;left:${p.x}px;top:${p.y}px;color:${colorOf(t.text)};${anim}">${t.text.replace(/</g, '&lt;')}</span>`;
const ease = 'cubic-bezier(0.65,0,0.35,1)';
ta.forEach((t, i) => {
  const pa = pos(t);
  if (ia.has(i)) {
    const pb = pos(tb[ia.get(i)]);
    css += `@keyframes m${i}{from{transform:translate(${pa.x - pb.x}px,${pa.y - pb.y}px)}to{transform:translate(0px,0px)}}`;
    spans += span(t, pb, `animation:m${i} ${T}ms ${ease} both`);
  } else {
    css += `@keyframes r${i}{from{opacity:1}to{opacity:0}}`;
    spans += span(t, pa, `animation:r${i} ${T * 0.5}ms ${ease} both`);
  }
});
tb.forEach((t, j) => {
  if (!jb.has(j)) {
    css += `@keyframes a${j}{0%{opacity:0}50%{opacity:0}100%{opacity:1}}`;
    spans += span(t, pos(t), `animation:a${j} ${T}ms ${ease} both`);
  }
});
const frame = inner => `<div style="width:${W}px;height:${H}px;background:linear-gradient(135deg,#6d28d9,#db2777);display:flex;padding:24px"><div style="position:relative;flex:1;background:#282a36;border-radius:14px;font-family:'Geist Mono';font-size:${FS}px;line-height:${LH}px">${inner}</div></div>`;
const staticScene = toks => frame(toks.map(t => span(t, pos(t), '')).join(''));
const scenes = [
  {node: staticScene(ta), durationMs: 500},
  {node: frame(spans), durationMs: T},
  {node: staticScene(tb), durationMs: 700},
];
const frames = Math.round((500 + T + 700) / 1000 * 30);
for (const fmt of ['webp', 'gif', 'apng']) for (const dpr of [1, 2]) {
  const t0 = performance.now();
  const buf = await r.renderAnimation({scenes, width: W, height: H, fps: 30, format: fmt, devicePixelRatio: dpr, css: [css], ...(fmt === 'webp' ? {quality: 85} : {})});
  const ms = performance.now() - t0;
  await writeFile(`${OUT}out-${dpr}x.${fmt === 'apng' ? 'png' : fmt}`, buf);
  console.log(fmt, `${dpr}x`, `${ms.toFixed(0)}ms`, `${(buf.length / 1024).toFixed(0)}KB`, `frames=${frames}`, `${(ms / frames).toFixed(1)}ms/frame`);
}
const t1 = performance.now(); let n = 0;
for (let t = 0; t <= T; t += 1000 / 30, n++) {
  const png = await r.render(frame(spans), {width: W, height: H, format: 'png', timeMs: Math.round(t), css: [css], devicePixelRatio: 2});
  if ([0, 9, 14, 27].includes(n)) await writeFile(`${OUT}frame-${n}.png`, png);
}
console.log('per-frame png 2x', ((performance.now() - t1) / n).toFixed(1), 'ms/frame over', n);
