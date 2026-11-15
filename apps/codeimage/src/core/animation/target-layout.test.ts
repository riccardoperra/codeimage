import {expect, it} from 'vitest';
import {targetLayout} from './target-layout';
it('centers and shrinks a window in a padded social target without upscaling', () => {
  expect(
    targetLayout(
      {width: 1000, height: 500},
      {width: 2000, height: 500},
      {x: 40, y: 50},
    ),
  ).toEqual({width: 2000, height: 500, scale: 0.5, left: 40, top: 175});
  expect(
    targetLayout({width: 1000, height: 500}, {width: 200, height: 100}),
  ).toEqual({width: 200, height: 100, scale: 1, left: 400, top: 200});
});
