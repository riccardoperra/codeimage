import {Renderer} from '@takumi-rs/core';
import type {MeasuredNode} from '@takumi-rs/core';
import {expect, test} from 'vitest';
import {positionWatermark} from './watermarkGeometry';

const html = (text: string) =>
  `<div data-watermark-frame style="width:500px;height:240px;position:relative;padding:40px"><div data-surface style="width:420px;height:160px;position:relative"><div data-watermark-content style="width:420px;height:160px;position:relative"><div class="cm-line" style="position:absolute;bottom:0;right:0;white-space:pre">${text}</div><div data-watermark-home style="position:absolute;right:6px;bottom:-6px;width:125px;height:24.3px"><svg width="125" height="24.3" viewBox="0 0 125 24.3"><rect width="125" height="24.3" fill="red"/></svg></div></div></div></div>`;

test('measures real shaped text and keeps one SVG when moving', async () => {
  const renderer = new Renderer();
  const result = await positionWatermark({
    html: html('collision'),
    painted: true,
    inset: 8,
    measure: html => renderer.measure(html),
  });
  expect(result).toContain('data-watermark-placement="frame-bottom-right"');
  expect(result.match(/<svg\b/g)).toHaveLength(1);
  expect(result).not.toContain('CI_WATERMARK_PROBE');
  expect(result).not.toContain('NaN');
  expect(result).toContain('transform:scale(1)');
  const image = await renderer.render(result, {format: 'png'});
  expect(image.byteLength).toBeGreaterThan(100);
});

test('does not move a clear home after measuring whitespace fragments', async () => {
  const renderer = new Renderer();
  const result = await positionWatermark({
    html: html('    '),
    painted: true,
    inset: 8,
    measure: html => renderer.measure(html),
  });
  expect(result).toContain('data-watermark-placement="home"');
  expect(result).not.toContain('data-watermark-moved');
});

test('measures padded scaled text at its painted origin without changing pixels', async () => {
  const renderer = new Renderer();
  const source = `<div data-watermark-frame style="width:500px;height:300px;background:white;position:relative"><div data-surface style="position:absolute;left:80px;top:60px;transform:scale(.5);transform-origin:0 0;width:300px;height:100px"><div data-watermark-content><div class="cm-line" style="padding:10px 20px;color:black;font-size:16px"><span>word</span> <span>next</span></div><div data-watermark-home style="position:absolute;right:0;bottom:0;width:125px"><svg width="125" height="24.3" viewBox="0 0 125 24.3"><rect width="125" height="24.3" fill="red"/></svg></div></div></div></div>`;
  const wrapped = `<html><head></head><body style="margin:0">${source}</body></html>`;
  const original = await renderer.render(wrapped, {format: 'raw'});
  let wordOrigin: number[] | undefined;
  await positionWatermark({
    html: wrapped,
    painted: true,
    inset: 8,
    measure: async html => {
      expect(
        (await renderer.render(html, {format: 'raw'})).equals(original),
      ).toBe(true);
      const tree = await renderer.measure(html);
      const visit = (node: MeasuredNode) => {
        if (node.runs.some(run => run.text === 'word'))
          wordOrigin = node.transform;
        node.children.forEach(visit);
      };
      visit(tree);
      return tree;
    },
  });
  expect(wordOrigin).toEqual([0.5, 0, 0, 0.5, 90, 65]);
});

for (const pixelRatio of [1, 2, 3]) {
  test(`keeps CSS watermark geometry at output scale ${pixelRatio}`, async () => {
    const renderer = new Renderer();
    const result = await positionWatermark({
      html: html('collision'),
      painted: true,
      inset: 8,
      pixelRatio,
      measure: html => renderer.measure(html, {devicePixelRatio: pixelRatio}),
    });
    expect(result).toContain('data-watermark-placement="frame-bottom-right"');
    expect(result).toContain('transform:scale(1)');
  });
}
