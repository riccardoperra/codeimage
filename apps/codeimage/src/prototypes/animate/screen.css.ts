import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const phone = 'screen and (max-width: 768px)';

export const workspace = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '0 8px 8px',
  color: c.baseText,
  font: '13px/1.5 Inter, system-ui, sans-serif',
});

globalStyle(`${workspace} *, ${workspace} *::before, ${workspace} *::after`, {
  boxSizing: 'border-box',
});

export const canvas = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
  borderRadius: '22px',
  background: c.background,
});

export const panel = style({
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px 16px 14px',
  borderRadius: '22px',
  background: c.background,
  '@media': {
    [phone]: {padding: '12px'},
  },
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  minHeight: '36px',
});

export const spacer = style({flex: 1});

export const time = style({
  minWidth: '92px',
  fontSize: '12px',
  fontVariantNumeric: 'tabular-nums',
  color: c.descriptionTextColor,
});

export const stepBadge = style({
  fontSize: '12px',
  color: c.descriptionTextColor,
  '@media': {[phone]: {display: 'none'}},
});

export const inspector = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px 12px',
  minHeight: '40px',
  paddingTop: '10px',
  borderTop: `1px solid ${c.divider}`,
});

export const inspectorTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: '150px',
  fontWeight: 500,
});

export const field = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: c.descriptionTextColor,
});

export const numberField = style({width: '96px'});

export const hint = style({
  fontSize: '12px',
  color: c.descriptionTextColor,
});

export const kbd = style({
  padding: '1px 5px',
  borderRadius: '4px',
  background: c.input.backgroundColor,
  fontSize: '11px',
});

const enter = keyframes({
  from: {opacity: 0, transform: 'translate(-50%, -4px) scale(0.97)'},
});

// "Preview · click or type to edit step N", over the canvas.
export const previewPill = style({
  position: 'absolute',
  top: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '32px',
  padding: '0 14px 0 12px',
  border: 0,
  borderRadius: '999px',
  font: '500 12px/1 Inter, system-ui, sans-serif',
  color: c.baseText,
  background: c.panel.background,
  boxShadow: `0 0 0 1px ${c.divider}, ${themeVars.boxShadow.md}`,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  animation: `${enter} 180ms ${easeOut}`,
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&:active': {transform: 'translateX(-50%) scale(0.97)'},
  },
});

export const liveDot = style({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: c.primary,
});

const fade = keyframes({from: {opacity: 0}});

// The quieter status of the automatic mode, at the canvas's corner.
export const status = style({
  position: 'absolute',
  top: '14px',
  left: '16px',
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '28px',
  padding: '0 10px',
  borderRadius: '8px',
  fontSize: '12px',
  color: c.descriptionTextColor,
  background: c.input.backgroundColor,
  animation: `${fade} 150ms ease`,
  selectors: {
    '&[data-editing]': {color: c.baseText},
  },
});

export const titleField = style({width: '180px'});
