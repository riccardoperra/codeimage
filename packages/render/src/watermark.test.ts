import {expect, test} from 'vitest';
import {
  intersects,
  placeWatermark,
  isTransparentColor,
  canHostWatermarkFrame,
} from './watermark';
import type {Rect, WatermarkScene} from './watermark';

const home: Rect = {x: 300, y: 150, width: 125, height: 25};
const scene: WatermarkScene = {
  home,
  window: {x: 40, y: 40, width: 400, height: 150},
  content: {x: 56, y: 90, width: 368, height: 90},
  header: {x: 40, y: 40, width: 400, height: 40},
  frame: {bounds: {x: 0, y: 0, width: 480, height: 260}, inset: 8},
  code: [home],
  obstacles: [],
  gap: 4,
};

test('leaves a watermark unchanged when the code ends before it', () => {
  expect(
    placeWatermark({...scene, code: [{x: 56, y: 150, width: 100, height: 25}]}),
  ).toEqual({slot: 'home'});
});

test('moves overlapping code into an unused title bar without changing size', () => {
  const result = placeWatermark({
    ...scene,
    frame: null,
    code: [home, scene.content],
  });
  expect(result.slot).toBe('header-right');
  if (!('rect' in result)) throw new Error('Expected a moved watermark');
  expect(result.rect.width).toBe(home.width);
  expect(result.rect.height).toBe(home.height);
  expect(intersects(result.rect, home)).toBe(false);
});

test('rejects a title bar occupied by tabs and controls', () => {
  expect(
    placeWatermark({
      ...scene,
      frame: null,
      obstacles: scene.header ? [scene.header] : [],
    }).slot,
  ).toBe('content-right');
});

test('uses frame padding when header and code are occupied', () => {
  expect(placeWatermark({...scene, code: [scene.window]}).slot).toBe(
    'frame-bottom-right',
  );
});

test('avoids a signature in the bottom right', () => {
  expect(
    placeWatermark({
      ...scene,
      code: [scene.window],
      obstacles: [{x: 300, y: 220, width: 170, height: 30}],
    }).slot,
  ).toBe('frame-bottom-left');
});

test('never uses the frame when it has no painted background', () => {
  expect(placeWatermark({...scene, frame: null, code: [scene.window]})).toEqual(
    {slot: 'unavoidable'},
  );
});

test('does not choose a region smaller than the unchanged logo', () => {
  expect(
    placeWatermark({
      ...scene,
      frame: null,
      header: {x: 40, y: 40, width: 400, height: 10},
      code: [scene.window],
    }),
  ).toEqual({slot: 'unavoidable'});
});

test('is deterministic and returns home as soon as code no longer overlaps', () => {
  expect(placeWatermark(scene)).toEqual(placeWatermark(scene));
  expect(placeWatermark({...scene, code: []})).toEqual({slot: 'home'});
});

test('scales the same decision with the fitted window and frame', () => {
  const scale = (r: Rect): Rect => ({
    x: r.x / 2,
    y: r.y / 2,
    width: r.width / 2,
    height: r.height / 2,
  });
  expect(
    placeWatermark({
      ...scene,
      home: scale(home),
      window: scale(scene.window),
      content: scale(scene.content),
      header: scene.header && scale(scene.header),
      frame: scene.frame && {
        bounds: scale(scene.frame.bounds),
        inset: scene.frame.inset / 2,
      },
      code: scene.code.map(scale),
      gap: 2,
    }).slot,
  ).toBe(placeWatermark(scene).slot);
});

test('tries the tab strip only after frame and content slots', () => {
  expect(placeWatermark(scene).slot).toBe('frame-bottom-right');
  expect(placeWatermark({...scene, frame: null}).slot).toBe('content-right');
});

test('uses the left of the tab strip if the right is occupied', () => {
  expect(
    placeWatermark({
      ...scene,
      frame: null,
      code: [home, scene.content],
      obstacles: [{x: 250, y: 40, width: 190, height: 40}],
    }).slot,
  ).toBe('header-left');
});

test('keeps the original when both tab-strip corners are occupied too', () => {
  expect(
    placeWatermark({
      ...scene,
      frame: null,
      code: [home, scene.content],
      obstacles: scene.header ? [scene.header] : [],
    }).slot,
  ).toBe('unavoidable');
});

for (const color of [
  'transparent',
  '#0000',
  '#ffffff00',
  'rgba(0,0,0,.0)',
  'rgb(0 0 0 / 0%)',
  'hsl(0 0% 0% / 0%)',
  'RGBA(0, 0, 0, 0.0)',
  'oklch(0 0 0 / 0)',
]) {
  test(`recognizes transparent color ${color}`, () => {
    expect(isTransparentColor(color)).toBe(true);
  });
}
for (const color of [
  'black',
  '#000',
  '#ffffff01',
  'rgba(0,0,0,.01)',
  'rgb(0 0 0 / 1%)',
  'hsl(0 0% 0% / 100%)',
]) {
  test(`preserves painted color ${color}`, () => {
    expect(isTransparentColor(color)).toBe(false);
  });
}

test('only a visible painted frame can host the logo', () => {
  const frame = {
    visible: true,
    opacity: 1,
    backgroundColor: 'transparent',
    hasImage: false,
  };
  expect(canHostWatermarkFrame(frame)).toBe(false);
  expect(canHostWatermarkFrame({...frame, hasImage: true})).toBe(true);
  expect(canHostWatermarkFrame({...frame, backgroundColor: 'black'})).toBe(
    true,
  );
  expect(
    canHostWatermarkFrame({...frame, hasImage: true, visible: false}),
  ).toBe(false);
  expect(canHostWatermarkFrame({...frame, hasImage: true, opacity: 0})).toBe(
    false,
  );
});
