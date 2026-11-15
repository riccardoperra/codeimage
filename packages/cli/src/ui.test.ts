import {describe, expect, it} from 'vitest';
import {formatUsage, uiMode} from './ui';
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

describe('usage colour', () => {
  it('strips ANSI when stdout is piped or NO_COLOR is present', () => {
    const text = '\x1b[31mUsage\x1b[0m';
    expect(formatUsage(text, false, {})).toBe('Usage');
    expect(formatUsage(text, true, {NO_COLOR: ''})).toBe('Usage');
    expect(formatUsage(text, true, {})).toBe(text);
  });
});
