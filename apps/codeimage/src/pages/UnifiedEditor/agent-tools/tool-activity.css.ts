import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reduce = '(prefers-reduced-motion: reduce)';
const phone = 'screen and (max-width: 768px)';

// Bottom left as the What's new Nudge, and above it while it shows: the
// component sets --above-nudge to the room the Nudge takes.
export const card = style({
  position: 'fixed',
  left: '28px',
  bottom: 'max(28px, calc(var(--above-nudge, 0px) + 12px))',
  zIndex: 41,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  boxSizing: 'border-box',
  width: '340px',
  padding: '10px 10px 12px',
  borderRadius: '18px',
  color: c.baseText,
  background: c.background,
  boxShadow:
    'inset 0 0 0 1px rgba(128,128,128,.16), 0 20px 60px rgba(0,0,0,.2)',
  fontSize: '13px',
  transition: `opacity 250ms ${ease}, transform 250ms ${ease}`,
  '@starting-style': {opacity: 0, transform: 'translateY(12px)'},
  selectors: {
    '&[data-closing]': {
      opacity: 0,
      transform: 'translateY(12px)',
      pointerEvents: 'none',
      transitionDuration: '200ms',
    },
  },
  '@media': {
    [phone]: {
      left: '16px',
      width: 'calc(100vw - 32px)',
      bottom:
        'max(calc(16px + env(safe-area-inset-bottom, 0px)), calc(var(--above-nudge, 0px) + 12px))',
    },
    [reduce]: {
      transitionProperty: 'opacity',
      '@starting-style': {transform: 'none'},
      selectors: {'&[data-closing]': {transform: 'none'}},
    },
  },
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '6px',
});

export const heading = style({
  margin: 0,
  fontSize: '13px',
  fontWeight: themeVars.fontWeight.semibold,
});

export const chip = style({
  padding: '2px 8px',
  borderRadius: '999px',
  background: c.input.backgroundColor,
  color: c.descriptionTextColor,
  fontSize: '11px',
});

export const close = style({marginLeft: 'auto'});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const row = style({
  display: 'grid',
  gridTemplateColumns: '16px minmax(0, 1fr)',
  columnGap: '10px',
  alignItems: 'start',
  padding: '6px',
  borderRadius: '12px',
  transition: `opacity 200ms ${ease}, transform 200ms ${ease}`,
  '@starting-style': {opacity: 0, transform: 'translateY(6px)'},
  selectors: {'&[data-read-only]': {color: c.descriptionTextColor}},
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      '@starting-style': {transform: 'none'},
    },
  },
});

export const status = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '18px',
  selectors: {
    '&[data-status=failed]': {color: c.button.danger.backgroundColor},
  },
});

const spin = keyframes({to: {transform: 'rotate(360deg)'}});

export const spinner = style({
  width: '12px',
  height: '12px',
  boxSizing: 'border-box',
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 800ms linear infinite`,
  '@media': {[reduce]: {animation: 'none', opacity: 0.6}},
});

export const icon = style({width: '14px', height: '14px'});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const titleLine = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  minWidth: 0,
});

export const title = style({
  flex: 'none',
  fontWeight: themeVars.fontWeight.medium,
  selectors: {[`${row}[data-read-only] &`]: {fontWeight: 'normal'}},
});

export const name = style({
  overflow: 'hidden',
  color: c.descriptionTextColor,
  fontFamily: 'ui-monospace, monospace',
  fontSize: '11px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const oneLine = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '12px',
} as const;

export const summary = style({...oneLine, color: c.descriptionTextColor});

export const error = style({
  ...oneLine,
  color: c.button.danger.backgroundColor,
});
