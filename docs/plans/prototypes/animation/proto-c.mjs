import {readFile, writeFile} from 'node:fs/promises';
const WT = '/Users/riccardoperra/WebstormProjects/codeimage/.claude/worktrees/code-animation-plan';
const DEPS = new URL('../anim-deps/node_modules/', import.meta.url).pathname;
const OUT = new URL('./', import.meta.url).pathname;
const wasm = await import(DEPS + '@takumi-rs/wasm/dist/export.mjs');
const {toKeyedTokens, syncTokenKeys} = await import(DEPS + '@shikijs/magic-move/dist/core.mjs');
wasm.initSync({module: await readFile(DEPS + '@takumi-rs/wasm/pkg/takumi_wasm_bg.wasm')});
const r = new wasm.Renderer();
await r.registerFont({name: 'Geist Mono', data: await readFile(WT + '/apps/codeimage/public/assets/fonts/geist_mono/GeistMono[wght].ttf')});

const SRC = (await readFile(WT + '/apps/codeimage/src/hooks/use-export-image.ts', 'utf8')).split('\n');
const A = SRC.slice(40, 75).join('\n');
const B = SRC.slice(40, 75).map((l, i) => i % 5 === 0 ? '  // step two\n' + l.replace('const', 'let') : l).join('\n');

const lexLines = code => {
  let offset = 0;
  return code.split('\n').map(line => {
    const toks = []; const re = /\s+|\w+|[^\w\s]+/g; let m;
    while ((m = re.exec(line))) toks.push({content: m[0], offset: offset + m.index, color: '#fff'});
    offset += line.length + 1;
    return toks;
  });
};
const ka = toKeyedTokens(A, lexLines(A)), kb = toKeyedTokens(B, lexLines(B));
const synced = syncTokenKeys(ka, kb);
const keysA = new Set(synced.from.tokens.filter(t => t.content.trim()).map(t => t.key));
const visibleB = synced.to.tokens.filter(t => t.content.trim());
console.log('magic-move kept', visibleB.filter(t => keysA.has(t.key)).length, 'of', visibleB.length, 'visible tokens in B');

const FS = 18, LH = FS * 1.4, PAD = 48, W = 1920, H = 1080, T = 1000;
const probe = await r.measure(`<div style="font-family:'Geist Mono';font-size:${FS}px;display:flex"><span>${'M'.repeat(40)}</span></div>`);
const findRuns = n => n.runs.length ? n.runs : n.children.flatMap(findRuns);
const CW = findRuns(probe)[0].width / 40;
const place = info => {
  let line = 0, col = 0; const out = [];
  for (const t of info.tokens) {
    if (t.content === '\n') { line++; col = 0; continue; }
    if (t.content.trim()) out.push({...t, x: PAD + col * CW, y: PAD + line * LH});
    col += t.content.length;
  }
  return out;
};
const pa = place(synced.from), pb = place(synced.to);
const byKeyA = new Map(pa.map(t => [t.key, t])), byKeyB = new Map(pb.map(t => [t.key, t]));
let css = '', spans = '';
const span = (t, x, y, anim) => `<span style="position:absolute;left:${x}px;top:${y}px;color:${t.color};${anim}">${t.content.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`;
const ease = 'cubic-bezier(0.65,0,0.35,1)';
pa.forEach((t, i) => {
  const b = byKeyB.get(t.key);
  if (b) { css += `@keyframes m${i}{from{transform:translate(${t.x - b.x}px,${t.y - b.y}px)}to{transform:translate(0px,0px)}}`; spans += span(t, b.x, b.y, `animation:m${i} ${T}ms ${ease} both`); }
  else { css += `@keyframes r${i}{from{opacity:1}to{opacity:0}}`; spans += span(t, t.x, t.y, `animation:r${i} ${T * 0.3}ms ${ease} both`); }
});
pb.forEach((t, j) => { if (!byKeyA.has(t.key)) { css += `@keyframes a${j}{0%{opacity:0}70%{opacity:0}100%{opacity:1}}`; spans += span(t, t.x, t.y, `animation:a${j} ${T}ms ${ease} both`); } });
const frame = inner => `<div style="width:${W}px;height:${H}px;background:linear-gradient(135deg,#6d28d9,#db2777);display:flex;padding:24px"><div style="position:relative;flex:1;background:#282a36;border-radius:14px;box-shadow:0 20px 68px rgba(0,0,0,0.55);overflow:hidden;font-family:'Geist Mono';font-size:${FS}px;line-height:${LH}px">${inner}</div></div>`;
const scenes = [{node: frame(spans), durationMs: T}];
const frames = Math.round(T / 1000 * 60);
for (const fmt of ['webp', 'gif']) {
  const fps = fmt === 'gif' ? 50 : 60;
  const t0 = performance.now();
  const buf = await r.renderAnimation({scenes, width: W, height: H, fps, format: fmt, css: [css], ...(fmt === 'webp' ? {quality: 85} : {})});
  const ms = performance.now() - t0;
  await writeFile(`${OUT}wasm-mm.${fmt}`, buf);
  console.log('wasm', fmt, `${ms.toFixed(0)}ms`, `${(buf.length / 1024).toFixed(0)}KB`, `${(ms / (T / 1000 * fps)).toFixed(1)}ms/frame`);
}
const t1 = performance.now(); let n = 0;
for (let t = 0; t <= T; t += 1000 / 60, n++) {
  const px = await r.render(frame(spans), {width: W, height: H, format: 'raw', timeMs: Math.round(t), css: [css]});
  if (n === 30) await writeFile(`${OUT}wasm-mid.png`, await r.render(frame(spans), {width: W, height: H, format: 'png', timeMs: Math.round(t), css: [css]}));
}
console.log('wasm per-frame raw 1080p', ((performance.now() - t1) / n).toFixed(1), 'ms/frame over', n, 'tokens', pa.length, pb.length);
