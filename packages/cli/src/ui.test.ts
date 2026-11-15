import {describe, expect, it} from 'vitest';
import {uiMode} from './ui';
describe('terminal mode', () => {
  it('requires both output streams and disables rich UI in CI and quiet mode', () => {
    expect(uiMode(false, true, true, {})).toBe('interactive');
    expect(uiMode(false, false, true, {})).toBe('plain');
    expect(uiMode(false, true, false, {})).toBe('plain');
    expect(uiMode(false, true, true, {CI: '1'})).toBe('plain');
    expect(uiMode(false, true, true, {TERM: 'dumb'})).toBe('plain');
    expect(uiMode(true, true, true, {})).toBe('quiet');
  });
});
