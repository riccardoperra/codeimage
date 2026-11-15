import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {curve, duration, illustrationFor, ms, reduceMotion} from './motion';

const c = themeVars.dynamicColors;
const colors = themeVars.backgroundColor;
export const frame = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '140px',
  borderRadius: '10px',
  overflow: 'hidden',
  background: c.panel.background,
  color: c.baseText,
  vars: {
    '--picture-green': colors.green[600],
    '--picture-red': colors.red[600],
    '--picture-keyword': colors.purple[600],
    '--picture-amber': colors.orange[600],
  },
  selectors: {'&[data-mode="thumb"]': {height: '100%', borderRadius: '6px'}},
});
globalStyle(`:root[data-cui-theme="dark"] .${frame}`, {
  vars: {
    '--picture-green': colors.green[300],
    '--picture-red': colors.red[300],
    '--picture-keyword': colors.purple[300],
    '--picture-amber': colors.orange[300],
  },
});
globalStyle(`${frame} svg`, {display: 'block', maxWidth: '100%', flex: 'none'});
export const window = style({
  fill: c.background,
  stroke: `color-mix(in srgb, ${c.baseText} 18%, transparent)`,
  strokeWidth: 2,
});
export const glass = style({
  fill: c.input.backgroundColor,
  stroke: `color-mix(in srgb, ${c.baseText} 16%, transparent)`,
  strokeWidth: 2,
});
export const wash = style({
  fill: `color-mix(in srgb, var(--picture-keyword) 18%, ${c.panel.background})`,
});
export const ink = style({fill: c.baseText});
export const label = style({
  fill: c.descriptionTextColor,
  fontSize: '9px',
  fontFamily: 'ui-monospace, monospace',
});
export const code = style({
  fill: c.baseText,
  fontSize: '10px',
  fontFamily: 'ui-monospace, monospace',
  whiteSpace: 'pre',
});
export const keyword = style({fill: 'var(--picture-keyword)'});
export const string = style({fill: 'var(--picture-green)'});
export const functionColor = style({fill: c.primary});
export const comment = style({fill: c.descriptionTextColor});
export const accent = style({fill: c.primary});
export const knob = style({fill: colors.white});
export const red = style({fill: 'var(--picture-red)'});
export const green = style({fill: 'var(--picture-green)'});
export const amber = style({fill: 'var(--picture-amber)'});
const stroke = (color: string) =>
  style({
    stroke: color,
    strokeWidth: 2,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  });
export const edge = stroke(
  `color-mix(in srgb, ${c.baseText} 16%, transparent)`,
);
export const inkStroke = stroke(c.baseText);
export const accentStroke = stroke(c.primary);
export const keywordStroke = stroke('var(--picture-keyword)');
export const stringStroke = stroke('var(--picture-green)');
export const redStroke = stroke('var(--picture-red)');
export const greenStroke = stroke('var(--picture-green)');
export const added = style({
  fill: 'color-mix(in srgb, var(--picture-green) 16%, transparent)',
});
export const removed = style({
  fill: 'color-mix(in srgb, var(--picture-red) 16%, transparent)',
});
const arrive = keyframes({
  from: {opacity: 0, transform: 'translateY(6px)'},
  to: {opacity: 1, transform: 'none'},
});
const disappear = keyframes({from: {opacity: 1}, to: {opacity: 0}});
const appear = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const toggle = keyframes({
  from: {transform: 'translateX(-14px)'},
  to: {transform: 'none'},
});
function play(name: string, length: number = illustrationFor.theme) {
  return style({
    selectors: {
      [`${frame}[data-mode="play"][data-playing] &`]: {
        animation: `${name} ${ms(length)} ${curve.inOut} ${ms(duration.playAt)} both`,
      },
    },
    '@media': {
      [reduceMotion]: {
        selectors: {
          [`${frame}[data-mode="play"][data-playing] &`]: {animation: 'none'},
        },
      },
    },
  });
}
export const move = play(arrive);
export const split = play(
  keyframes({
    from: {opacity: 0, transform: 'translateX(-28px)'},
    to: {opacity: 1, transform: 'none'},
  }),
);
export const switchOn = play(toggle);
export const before = style([
  play(disappear, illustrationFor.redact),
  {opacity: 0},
]);
export const replacement = play(appear, illustrationFor.redact);
// Keyboard-triggered Nudge steps settle immediately, including their pictures.
globalStyle(`[data-instant] ${frame} *`, {animation: 'none !important'});

export const markLine = style([
  play(
    keyframes({
      from: {opacity: 0, transform: 'scaleX(.96)'},
      to: {opacity: 1, transform: 'none'},
    }),
  ),
  {transformOrigin: 'left center', transformBox: 'fill-box'},
]);
