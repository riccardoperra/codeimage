import {AVAILABLE_GRADIENTS} from '@codeimage/config';
import {describe, expect, it} from 'vitest';
import {luminance, parseColors, toneOfBackground} from './signatureColors';

describe('signature tone', () => {
  it('reads hex, rgb with percentages or spaces, and hsl stops', () => {
    expect(
      parseColors(
        'linear-gradient(152deg, rgb(87% 61% 43%) 0%, #fff 50%, hsl(0 0% 0%))',
      ).map(color => color.map(Math.round)),
    ).toEqual([
      [222, 156, 110],
      [255, 255, 255],
      [0, 0, 0],
    ]);
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
  });

  it('puts white ink on the default gradient and dark ink on light fills', () => {
    expect(
      toneOfBackground(
        'linear-gradient(152deg, rgb(87% 61% 43%) 0%, rgb(49% 14% 95%) 100%)',
      ),
    ).toBe('dark');
    expect(
      toneOfBackground('linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)'),
    ).toBe('light');
    expect(toneOfBackground('#FFFFFF')).toBe('light');
    expect(toneOfBackground('#1a1a1a')).toBe('dark');
  });

  it('keeps white ink on a gradient with one dark end', () => {
    expect(
      toneOfBackground(
        'linear-gradient(140deg, rgb(241 160 61), rgb(192 74 65),  rgb(115, 52, 52))',
      ),
    ).toBe('dark');
  });

  it('falls back to white ink when it cannot read a colour', () => {
    expect(toneOfBackground(null)).toBe('dark');
    expect(toneOfBackground('transparent')).toBe('dark');
    for (const gradient of AVAILABLE_GRADIENTS)
      expect(parseColors(gradient).length).toBeGreaterThan(1);
  });
});
