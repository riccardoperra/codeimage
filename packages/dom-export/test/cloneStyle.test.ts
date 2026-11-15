import {afterEach, describe, expect, it} from 'vitest';
import {copyUserComputedStyleFast, removeSandbox} from '../src/lib/cloneStyle';

describe('cloned typography', () => {
  afterEach(() => {
    removeSandbox();
    document.body.replaceChildren();
  });

  it.each(['14px', '14.5px', '16px'])('preserves a %s font size', fontSize => {
    const source = document.createElement('div');
    source.style.fontSize = fontSize;
    document.body.appendChild(source);
    const clone = document.createElement('div');

    copyUserComputedStyleFast(getComputedStyle(source), null, clone);
    document.body.appendChild(clone);

    expect(getComputedStyle(clone).fontSize).toBe(fontSize);
  });

  it('preserves a child font size that differs from its parent', () => {
    const parent = document.createElement('div');
    parent.style.fontSize = '20px';
    const child = document.createElement('span');
    child.style.fontSize = '14.5px';
    parent.appendChild(child);
    document.body.appendChild(parent);
    const clone = document.createElement('span');

    copyUserComputedStyleFast(
      getComputedStyle(child),
      getComputedStyle(parent),
      clone,
    );
    parent.appendChild(clone);

    expect(getComputedStyle(clone).fontSize).toBe('14.5px');
  });
});
