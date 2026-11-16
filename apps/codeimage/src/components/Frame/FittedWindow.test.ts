import {describe, expect, it} from 'vitest';
import {fittedPlacement} from './FittedWindow';

describe('fittedPlacement', () => {
  it('centers without growing and snaps to whole pixels', () => {
    expect(
      fittedPlacement({width: 801, height: 601}, {width: 480, height: 300}),
    ).toEqual({left: 161, top: 151, scale: 1});
  });
  it('shrinks long content within the viewport', () => {
    expect(
      fittedPlacement({width: 1000, height: 600}, {width: 500, height: 1200}),
    ).toEqual({left: 375, top: 0, scale: 0.5});
  });
  it('handles an empty viewport without a negative scale', () => {
    expect(
      fittedPlacement({width: 0, height: 0}, {width: 480, height: 300}),
    ).toEqual({left: 0, top: 0, scale: 0});
  });
});
