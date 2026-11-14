import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const WT = '/Users/riccardoperra/WebstormProjects/codeimage/.claude/worktrees/code-animation-plan';
const OUT = new URL('./', import.meta.url).pathname;
const require = createRequire(WT + '/packages/render/package.json');
const {Renderer} = require('@takumi-rs/core');
const r = new Renderer();
const css = '@keyframes grow{from{height:120px;width:300px}to{height:400px;width:700px}}@keyframes fade{from{opacity:0}to{opacity:1}}';
const html = `<div style="width:800px;height:500px;background:#6d28d9;display:flex;align-items:center;justify-content:center"><div style="background:#282a36;border-radius:14px;box-shadow:0 20px 68px rgba(0,0,0,.55);animation:grow 1000ms ease-in-out both;display:flex"><div style="margin:20px;width:100px;height:30px;background:#ff79c6;animation:fade 1000ms linear both"></div></div></div>`;
for (const t of [0, 500, 1000]) {
  await writeFile(`${OUT}size-${t}.png`, await r.render(html, {width: 800, height: 500, format: 'png', timeMs: t, css: [css]}));
  const m = await r.measure(html, {width: 800, height: 500, timeMs: t, css: [css]});
  console.log(t, 'window', Math.round(m.children[0].width), 'x', Math.round(m.children[0].height));
}
