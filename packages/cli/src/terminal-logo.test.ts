import {describe, expect, it} from 'vitest';
import {PNG} from 'pngjs';
import {HELP_LOGO, HELP_LOGO_PNG} from './help-logo';
import {
  formatHelpLogo,
  itermImage,
  kittyImage,
  logoProtocol,
} from './terminal-logo';

describe('logo protocol', () => {
  it.each([
    {env: {TERM: 'xterm-kitty'}, protocol: 'kitty'},
    {env: {TERM_PROGRAM: 'ghostty'}, protocol: 'kitty'},
    {env: {TERM_PROGRAM: 'WezTerm'}, protocol: 'kitty'},
    {env: {KITTY_WINDOW_ID: '1'}, protocol: 'kitty'},
    {env: {KITTY_WINDOW_ID: ''}, protocol: 'kitty'},
    {env: {TERM_PROGRAM: 'iTerm.app'}, protocol: 'iterm'},
    {env: {TERM_PROGRAM: 'vscode'}, protocol: 'iterm'},
    {env: {LC_TERMINAL: 'iTerm2'}, protocol: 'iterm'},
    {env: {TERM: 'xterm-256color'}, protocol: 'halfblock'},
    {env: {}, protocol: 'halfblock'},
    {env: {TERM: 'xterm-kitty', TERM_PROGRAM: 'vscode'}, protocol: 'kitty'},
  ])('selects $protocol for $env', ({env, protocol}) => {
    expect(logoProtocol(env)).toBe(protocol);
  });

  it.each([
    {TMUX: '/tmp/tmux-501/default,123,0'},
    {TMUX: ''},
    {TERM: 'screen'},
    {TERM: 'screen-256color'},
    {TERM: 'tmux-256color'},
  ])('uses half-blocks inside a multiplexer: %j', multiplexer => {
    for (const terminal of [
      {TERM: 'xterm-kitty'},
      {TERM_PROGRAM: 'ghostty'},
      {TERM_PROGRAM: 'WezTerm'},
      {KITTY_WINDOW_ID: '1'},
      {TERM_PROGRAM: 'iTerm.app'},
      {TERM_PROGRAM: 'vscode'},
      {LC_TERMINAL: 'iTerm2'},
    ]) {
      const env = {...terminal, ...multiplexer};
      expect(logoProtocol(env)).toBe('halfblock');
      expect(formatHelpLogo(env)).toBe(HELP_LOGO);
    }
  });
});

describe('inline image data', () => {
  it('leaves the rounded half-block corners on the terminal default background', () => {
    const rows = HELP_LOGO.split('\n');
    expect(rows[0]).toMatch(/^\x1b\[39;49m \x1b\[38;2;\d+;\d+;\d+;49m▄/);
    expect(rows[6]).toMatch(/^\x1b\[39;49m \x1b\[38;2;\d+;\d+;\d+;49m▀/);
    expect(rows[0]).toContain('\x1b[39;49m \x1b[0m');
    expect(rows[6]).toContain('\x1b[39;49m \x1b[0m');
  });

  it('embeds the blue gradient square with transparent corners and white bars', () => {
    const png = PNG.sync.read(Buffer.from(HELP_LOGO_PNG, 'base64'));
    expect([png.width, png.height]).toEqual([96, 96]);
    const pixel = (x: number, y: number) => [
      ...png.data.subarray(
        (y * png.width + x) * 4,
        (y * png.width + x) * 4 + 4,
      ),
    ];
    for (const [x, y] of [
      [0, 0],
      [95, 0],
      [0, 95],
      [95, 95],
    ]) {
      expect(pixel(x, y)[3]).toBe(0);
    }
    const top = pixel(48, 1);
    const bottom = pixel(48, 94);
    expect(top[0]).toBe(0);
    expect(bottom[0]).toBe(0);
    expect(top[2]).toBeGreaterThan(bottom[2]);
    expect(top[3]).toBe(255);
    expect(bottom[3]).toBe(255);
    for (const [x, y] of [
      [39, 25],
      [44, 37],
      [37, 53],
      [53, 61],
      [58, 74],
    ]) {
      expect(pixel(x, y).every(channel => channel > 240)).toBe(true);
    }
  });

  it.each([4, 4096, 4100, 8192, 8196])(
    'chunks a %i-byte Kitty payload with quiet replies and ST terminators',
    length => {
      const png = 'A'.repeat(length);
      const output = kittyImage(png);
      const chunks = [
        ...output.matchAll(/\x1b_G([^;]+);([A-Za-z0-9+/=]+)\x1b\\/g),
      ];
      expect(chunks).toHaveLength(Math.ceil(length / 4096));
      expect(chunks.map(chunk => chunk[0]).join('')).toBe(output);
      expect(chunks.map(chunk => chunk[2]).join('')).toBe(png);
      chunks.forEach((chunk, index) => {
        expect(chunk[2].length).toBeLessThanOrEqual(4096);
        expect(chunk[2].length % 4).toBe(0);
        expect(chunk[1]).toContain('q=2');
        expect(chunk[1]).toContain(`m=${index === chunks.length - 1 ? 0 : 1}`);
        expect(chunk[1]).toBe(
          index === 0
            ? `a=T,f=100,t=d,c=14,r=7,C=1,q=2,m=${chunks.length === 1 ? 0 : 1}`
            : `q=2,m=${index === chunks.length - 1 ? 0 : 1}`,
        );
      });
    },
  );

  it('transmits the embedded PNG bytes directly with Kitty', () => {
    const chunks = [...kittyImage().matchAll(/\x1b_G[^;]+;([^\x1b]+)\x1b\\/g)];
    expect(chunks.map(chunk => chunk[1]).join('')).toBe(HELP_LOGO_PNG);
  });

  it('uses an inline iTerm2 File OSC with cell dimensions and a BEL terminator', () => {
    expect(itermImage()).toBe(
      `\x1b]1337;File=inline=1;width=14;height=7;preserveAspectRatio=1:${HELP_LOGO_PNG}\x07`,
    );
  });
});

describe('inline image layout', () => {
  it.each([{TERM: 'xterm-kitty'}, {TERM_PROGRAM: 'iTerm.app'}])(
    'reserves the image box and places the wordmark beside its middle row: %j',
    env => {
      const logo = formatHelpLogo(env);
      expect(logo.startsWith(`${'\n'.repeat(7)}\x1b[7A\r\x1b7`)).toBe(true);
      expect(logo).toContain(env.TERM ? kittyImage() : itermImage());
      expect(
        logo.endsWith('\x1b8\x1b[3B\x1b[17G\x1b[0;1mCodeImage\x1b[0m\x1b[3B\r'),
      ).toBe(true);
      expect(logo).not.toContain('▀');
    },
  );
});
