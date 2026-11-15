import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const phone = 'screen and (max-width: 768px)';

const fadeIn = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const fadeOut = keyframes({from: {opacity: 1}, to: {opacity: 0}});
const sheetIn = keyframes({
  from: {opacity: 0, transform: 'scale(0.96)'},
  to: {opacity: 1, transform: 'scale(1)'},
});
const sheetOut = keyframes({
  from: {opacity: 1, transform: 'scale(1)'},
  to: {opacity: 0, transform: 'scale(0.98)'},
});

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: c.dialog.overlayBackgroundColor,
  animation: `${fadeOut} 150ms ease-out`,
  selectors: {'&[data-expanded]': {animation: `${fadeIn} 200ms ease-out`}},
});

export const position = style({
  position: 'fixed',
  inset: 0,
  zIndex: 101,
  display: 'grid',
  placeItems: 'center',
  padding: '16px',
  pointerEvents: 'none',
});

export const sheet = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  boxSizing: 'border-box',
  width: 'min(800px, 100%)',
  maxHeight: 'calc(100dvh - 32px)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '20px',
  borderRadius: '24px',
  background: c.dialog.panelBackgroundColor,
  boxShadow: c.dialog.panelShadow,
  color: c.baseText,
  outline: 'none',
  pointerEvents: 'auto',
  transformOrigin: 'center',
  animation: `${sheetOut} 150ms ${easeOut}`,
  selectors: {
    '&[data-expanded]': {animation: `${sheetIn} 220ms ${easeOut}`},
    '&[data-instant]': {animation: 'none'},
  },
  '@media': {
    [reducedMotion]: {
      animation: `${fadeOut} 150ms ease-out`,
      selectors: {
        '&[data-expanded]': {animation: `${fadeIn} 200ms ease-out`},
        '&[data-instant]': {animation: 'none'},
      },
    },
    [phone]: {padding: '16px', gap: '16px'},
  },
});

export const head = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
});

export const title = style({
  margin: 0,
  fontSize: themeVars.fontSize.lg,
  fontWeight: themeVars.fontWeight.semibold,
});

export const body = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
  gap: '20px',
  '@media': {
    [phone]: {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});

export const preview = style({
  display: 'grid',
  placeItems: 'center',
  minHeight: '240px',
  padding: '16px',
  borderRadius: '16px',
  background: c.background,
  overflow: 'hidden',
  '@media': {[phone]: {minHeight: '160px'}},
});

export const image = style({
  display: 'block',
  maxWidth: '100%',
  maxHeight: '320px',
  objectFit: 'contain',
  borderRadius: '6px',
  animation: `${fadeIn} 200ms ease-out`,
  '@media': {[phone]: {maxHeight: '180px'}},
});

export const choices = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
});

export const download = style({
  minWidth: '200px',
  '@media': {[phone]: {width: '100%'}},
});

export const moreSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  borderRadius: '16px',
  background: c.background,
});

export const moreTitle = style({
  margin: '0 8px',
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.medium,
  color: c.descriptionTextColor,
});

export const more = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '2px',
  '@media': {[phone]: {gridTemplateColumns: 'minmax(0, 1fr)'}},
});
