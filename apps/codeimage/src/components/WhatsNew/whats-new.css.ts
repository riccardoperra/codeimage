import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reduce = '(prefers-reduced-motion: reduce)';
export const surface = style({
  color: c.baseText,
  background: c.background,
  borderRadius: '18px',
  boxShadow: '0 0 0 1px rgba(128,128,128,.16), 0 20px 60px rgba(0,0,0,.2)',
  transition: `opacity 240ms ${ease}, transform 240ms ${ease}`,
  '@starting-style': {opacity: 0, transform: 'translateY(12px) scale(.97)'},
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      transform: 'none',
      '@starting-style': {transform: 'none'},
    },
  },
});
export const nudge = style([
  surface,
  {
    position: 'fixed',
    left: '28px',
    bottom: '28px',
    zIndex: 40,
    width: '340px',
    maxWidth: 'calc(100vw - 24px)',
    overflow: 'hidden',
    '@media': {
      'screen and (max-width: 768px)': {
        left: '12px',
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      },
    },
  },
]);
export const collapsed = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
});
export const summary = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: '3px',
  fontSize: '13px',
});
export const muted = style({color: c.descriptionTextColor, fontSize: '12px'});
export const expanded = style({padding: '10px 10px 12px'});
export const copy = style({padding: '14px 6px 4px'});
export const title = style({
  margin: '8px 0 4px',
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: 1.3,
});
export const body = style({
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: '13px',
  lineHeight: 1.5,
});
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 6px 0',
});
export const steps = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  gap: '5px',
});
export const step = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: c.descriptionTextColor,
  opacity: 0.25,
  selectors: {'&[data-current]': {background: c.primary, opacity: 1}},
});
export const tag = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  borderRadius: '6px',
  background: c.input.backgroundColor,
  color: c.descriptionTextColor,
  fontSize: '11px',
  fontWeight: 500,
});
export const illustration = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  height: '140px',
  borderRadius: '10px',
  background: c.panel.background,
  color: c.primary,
  overflow: 'hidden',
});
export const miniWindow = style({
  width: '180px',
  color: c.baseText,
  lineHeight: 1.8,
  padding: '12px',
  borderRadius: '10px',
  background: c.background,
  boxShadow: '0 4px 16px rgba(0,0,0,.08)',
  fontSize: '11px',
});
export const redacted = style({color: c.primary, fontWeight: 600});
export const wireCanvas = style({fill: 'currentColor', opacity: 0.1});
export const wireFrame = style({fill: 'currentColor', opacity: 0.3});
export const commandAnchor = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
});
export const dotAnchor = style({
  display: 'inline-flex',
  flex: 'none',
  alignItems: 'center',
  verticalAlign: 'middle',
});
export const dot = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  padding: 0,
  border: 0,
  borderRadius: '50%',
  background: 'transparent',
  color: c.primary,
  cursor: 'pointer',
  transition: `transform 120ms ${ease}`,
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      selectors: {'&:active': {transform: 'none'}},
    },
  },
  selectors: {
    '&:active': {transform: 'scale(.97)'},
    '&::after': {
      content: '""',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: 'currentColor',
      boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 12%, transparent)',
    },
    '&[data-seen]::after': {opacity: 0},
    '&:focus-visible': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '1px',
    },
  },
});
globalStyle(`${commandAnchor} > ${dotAnchor}`, {
  position: 'absolute',
  right: '-9px',
  top: '-9px',
  zIndex: 1,
});
export const coachmark = style([
  surface,
  {
    width: '290px',
    maxWidth: 'calc(100vw - 24px)',
    padding: '10px 10px 12px',
    zIndex: 1000,
    outline: 'none',
    transformOrigin: 'var(--kb-popover-content-transform-origin)',
    transitionDuration: '180ms',
    '@starting-style': {opacity: 0, transform: 'scale(.96)'},
    '@media': {[reduce]: {'@starting-style': {transform: 'none'}}},
  },
]);
export const sheet = style({
  maxHeight: 'min(760px, calc(100dvh - 32px))',
  overflowY: 'auto',
  padding: '24px',
  color: c.baseText,
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '16px',
      maxHeight: 'calc(100dvh - 32px)',
    },
  },
});
export const hero = style({textAlign: 'center', padding: '28px 0 32px'});
export const heroTitle = style({
  fontSize: '34px',
  fontWeight: 600,
  letterSpacing: '-.02em',
  margin: '16px 0 10px',
});
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px',
  '@media': {
    'screen and (max-width: 768px)': {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});
export const card = style({
  padding: '12px',
  borderRadius: '16px',
  background: c.panel.background,
  selectors: {'&:first-child': {gridColumn: '1 / -1'}},
});
export const sheetFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '12px',
  paddingTop: '24px',
});
export const link = style({
  color: c.descriptionTextColor,
  fontSize: '12px',
  textUnderlineOffset: '3px',
});
const controls = `${nudge} button, ${coachmark} button, ${sheet} button`;
globalStyle(controls, {
  transition: `transform 120ms ${ease}`,
  '@media': {[reduce]: {transitionProperty: 'opacity'}},
});
globalStyle(
  `${nudge} button:active, ${coachmark} button:active, ${sheet} button:active`,
  {transform: 'scale(.97)', '@media': {[reduce]: {transform: 'none'}}},
);
