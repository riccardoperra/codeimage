import {describe, expect, it} from 'vitest';
import {toneOfPixels, TONE_SAMPLE_SIZE} from './signatureTone';

describe('toneOfPixels', () => {
  it('samples only the bottom third with the shared luminance threshold', () => {
    const sample = new Uint8Array(TONE_SAMPLE_SIZE ** 2 * 4).fill(255);
    expect(toneOfPixels(sample)).toBe('light');
    sample.fill(0, TONE_SAMPLE_SIZE * 16 * 4);
    expect(toneOfPixels(sample)).toBe('dark');
    sample.fill(178);
    expect(toneOfPixels(sample)).toBe('dark');
    sample.fill(179);
    expect(toneOfPixels(sample)).toBe('light');
  });
  it('leaves failed decoding to the host fallback', () => {
    expect(toneOfPixels(null)).toBeNull();
    expect(toneOfPixels(new Uint8Array(4))).toBeNull();
  });
});
