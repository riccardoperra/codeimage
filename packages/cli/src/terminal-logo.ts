import {
  HELP_LOGO,
  HELP_LOGO_COLUMNS,
  HELP_LOGO_PNG,
  HELP_LOGO_ROWS,
} from './help-logo';

export function logoProtocol(env = process.env) {
  if (env.TMUX !== undefined || /^(screen|tmux)/.test(env.TERM ?? '')) {
    return 'halfblock';
  }
  const program = env.TERM_PROGRAM?.toLowerCase();
  if (
    env.TERM === 'xterm-kitty' ||
    program === 'ghostty' ||
    program === 'wezterm' ||
    env.KITTY_WINDOW_ID !== undefined
  ) {
    return 'kitty';
  }
  if (
    program === 'iterm.app' ||
    program === 'vscode' ||
    env.LC_TERMINAL === 'iTerm2'
  ) {
    return 'iterm';
  }
  return 'halfblock';
}

export function kittyImage(png = HELP_LOGO_PNG) {
  let image = '';
  for (let offset = 0; offset < png.length; offset += 4096) {
    const chunk = png.slice(offset, offset + 4096);
    const more = offset + chunk.length < png.length ? 1 : 0;
    const options = offset
      ? `q=2,m=${more}`
      : `a=T,f=100,t=d,c=${HELP_LOGO_COLUMNS},r=${HELP_LOGO_ROWS},C=1,q=2,m=${more}`;
    image += `\x1b_G${options};${chunk}\x1b\\`;
  }
  return image;
}

export function itermImage() {
  return `\x1b]1337;File=inline=1;width=${HELP_LOGO_COLUMNS};height=${HELP_LOGO_ROWS};preserveAspectRatio=1:${HELP_LOGO_PNG}\x07`;
}

export function formatHelpLogo(env = process.env) {
  const protocol = logoProtocol(env);
  if (protocol === 'halfblock') return HELP_LOGO;
  const image = protocol === 'kitty' ? kittyImage() : itermImage();
  const middle = Math.floor(HELP_LOGO_ROWS / 2);
  return `${'\n'.repeat(HELP_LOGO_ROWS)}\x1b[${HELP_LOGO_ROWS}A\r\x1b7${image}\x1b8\x1b[${middle}B\x1b[${HELP_LOGO_COLUMNS + 3}G\x1b[0;1mCodeImage\x1b[0m\x1b[${HELP_LOGO_ROWS - middle - 1}B\r`;
}
