import {describe, expect, it} from 'vitest';
import {createSignature} from '@codeimage/store/frame/model';
import {framePadding, signatureScale} from './signatureLayout';

describe('signatureScale', () => {
  it('grows with the frame between its bounds', () => {
    expect(signatureScale(640)).toBe(1);
    expect(signatureScale(1080)).toBe(1.688);
    expect(signatureScale(1600)).toBe(2);
    expect(signatureScale(3000)).toBe(2);
    expect(signatureScale(300)).toBe(0.85);
    expect(signatureScale(0)).toBe(1);
  });
});

describe('framePadding', () => {
  it('reserves the space of the style at the scale', () => {
    const card = {...createSignature('me'), style: 'card' as const};
    expect(framePadding(32, null)).toBe('32px');
    expect(framePadding(32, card)).toBe('32px 32px 100px');
    expect(framePadding(32, card, 2)).toBe('32px 32px 200px');
    expect(framePadding(128, card)).toBe('128px 128px 128px');
  });
});
