import {stripVTControlCharacters} from 'node:util';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createUi, formatHelpUsage, uiMode} from './ui';
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

describe('help header', () => {
  const message = '\x1b[1mUsage\x1b[0m\ncodeimage [file...]';
  const header =
    'CodeImage CLI\nhttps://app.codeimage.dev · https://github.com/riccardoperra/codeimage';

  afterEach(() => vi.restoreAllMocks());

  it.each([{}, {COLORTERM: '256color'}, {COLORTERM: 'truecolor'}])(
    'adds a bold title and dim OSC 8 links when color is allowed: %j',
    env => {
      const help = formatHelpUsage(message, false, true, env);
      expect(help).toBe(
        '\x1b[1mCodeImage CLI\x1b[0m\n' +
          '\x1b[2m\x1b]8;;https://app.codeimage.dev\x1b\\https://app.codeimage.dev\x1b]8;;\x1b\\ · ' +
          '\x1b]8;;https://github.com/riccardoperra/codeimage\x1b\\https://github.com/riccardoperra/codeimage\x1b]8;;\x1b\\\x1b[0m' +
          `\n\n${message}`,
      );
      expect(stripVTControlCharacters(help)).toBe(
        `${header}\n\nUsage\ncodeimage [file...]`,
      );
    },
  );

  it.each([
    {name: 'piped stdout', tty: false, quiet: false, env: {}},
    {name: 'quiet', tty: true, quiet: true, env: {}},
    {name: 'NO_COLOR', tty: true, quiet: false, env: {NO_COLOR: '1'}},
    {name: 'empty NO_COLOR', tty: true, quiet: false, env: {NO_COLOR: ''}},
    {name: 'CI', tty: true, quiet: false, env: {CI: '1'}},
    {name: 'empty CI', tty: true, quiet: false, env: {CI: ''}},
    {name: 'dumb', tty: true, quiet: false, env: {TERM: 'dumb'}},
  ])(
    'keeps the header and strips all escapes for $name',
    ({tty, quiet, env}) => {
      const help = formatHelpUsage(message, quiet, tty, env);
      expect(help).toBe(`${header}\n\nUsage\ncodeimage [file...]`);
      expect(help).not.toContain('\x1b');
    },
  );

  it('separates the plain header from the description with one blank line', () => {
    expect(
      formatHelpUsage('Render code as an image (codeimage)', false, false, {}),
    ).toMatchInlineSnapshot(`
        "CodeImage CLI
        https://app.codeimage.dev · https://github.com/riccardoperra/codeimage

        Render code as an image"
      `);
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
