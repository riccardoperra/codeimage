import {stripVTControlCharacters} from 'node:util';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createUi, formatHelpUsage, formatUsage, uiMode} from './ui';
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

describe('help logo', () => {
  const message = '\x1b[1mUsage\x1b[0m\ncodeimage [file...]';
  const env = {COLORTERM: 'truecolor', TERM: 'xterm-256color'};

  afterEach(() => vi.restoreAllMocks());

  it.each(['truecolor', '24bit', 'TRUECOLOR'])(
    'prepends half-block art and a bold wordmark for %s terminals',
    COLORTERM => {
      const help = formatHelpUsage(message, false, true, {
        ...env,
        COLORTERM,
      });
      const logo = help.slice(0, -message.length - 2);
      const rows = stripVTControlCharacters(logo).split('\n');
      expect(rows).toHaveLength(9);
      expect(rows.every(row => row.slice(0, 20).length === 20)).toBe(true);
      expect(logo).toContain('▀');
      expect(logo).toContain('▄');
      expect(logo).toContain('\x1b[38;2;');
      expect(logo).toContain(';48;2;');
      expect(logo).toContain('\x1b[1mCodeImage\x1b[0m');
      expect(help).toBe(`${logo}\n\n${message}`);
    },
  );

  it.each([
    {name: 'piped stdout', tty: false, quiet: false, env},
    {name: 'quiet', tty: true, quiet: true, env},
    {name: 'NO_COLOR', tty: true, quiet: false, env: {...env, NO_COLOR: '1'}},
    {
      name: 'empty NO_COLOR',
      tty: true,
      quiet: false,
      env: {...env, NO_COLOR: ''},
    },
    {name: 'CI', tty: true, quiet: false, env: {...env, CI: '1'}},
    {name: 'empty CI', tty: true, quiet: false, env: {...env, CI: ''}},
    {name: 'dumb', tty: true, quiet: false, env: {...env, TERM: 'dumb'}},
    {name: '256 colors', tty: true, quiet: false, env: {COLORTERM: '256color'}},
    {name: 'unknown color support', tty: true, quiet: false, env: {}},
  ])('preserves existing help bytes for $name', ({tty, quiet, env}) => {
    expect(formatHelpUsage(message, quiet, tty, env)).toBe(
      formatUsage(message, tty, env),
    );
  });

  it('writes help only to stderr', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const expected = `${formatHelpUsage(message)}\n`;
    createUi().usage(message);
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledExactlyOnceWith(expected);
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
