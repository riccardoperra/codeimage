import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const reducedMotion = '(prefers-reduced-motion: reduce)';
const finePointer = '(hover: hover) and (pointer: fine)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

export const root = style({width: '100%', minWidth: 0});

// The trigger reads like the kit's select: the field's fill and height.
export const trigger = style({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  height: '36px',
  padding: '0 10px 0 12px',
  borderRadius: themeVars.borderRadius.lg,
  background: c.input.backgroundColor,
  color: c.baseText,
  fontSize: themeVars.fontSize.sm,
  cursor: 'pointer',
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&:focus-visible': focusRing,
    '&:active': {transform: 'scale(0.97)'},
  },
  '@media': {[reducedMotion]: {transition: 'none'}},
});

export const triggerText = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

export const name = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const placeholder = style({color: c.descriptionTextColor});

export const edited = style({
  flexShrink: 0,
  fontSize: themeVars.fontSize.xs,
  color: c.descriptionTextColor,
});

export const chevron = style({
  flexShrink: 0,
  color: c.descriptionTextColor,
  transition: `transform 160ms ${easeOut}`,
  selectors: {[`${trigger}[data-expanded] &`]: {transform: 'rotate(180deg)'}},
  '@media': {[reducedMotion]: {transition: 'none'}},
});

// The menu grows from its trigger, quickly, and leaves faster than it came.
const menuIn = keyframes({
  from: {opacity: 0, transform: 'scale(0.96)'},
  to: {opacity: 1, transform: 'scale(1)'},
});
const menuOut = keyframes({
  from: {opacity: 1, transform: 'scale(1)'},
  to: {opacity: 0, transform: 'scale(0.98)'},
});

export const menu = style({
  minWidth: '240px',
  maxWidth: '300px',
  transformOrigin: 'var(--kb-menu-content-transform-origin)',
  animation: `${menuOut} 120ms ${easeOut}`,
  selectors: {'&[data-expanded]': {animation: `${menuIn} 160ms ${easeOut}`}},
  '@media': {
    [reducedMotion]: {
      animation: 'none',
      selectors: {'&[data-expanded]': {animation: 'none'}},
    },
  },
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '36px',
  fontSize: themeVars.fontSize.sm,
});

export const check = style({
  flexShrink: 0,
  width: '14px',
  fontSize: '12px',
  color: c.primary,
  textAlign: 'center',
});

export const itemText = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  lineHeight: 1.3,
});

export const meta = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: themeVars.fontSize.xs,
  color: c.descriptionTextColor,
});

export const badge = style({
  flexShrink: 0,
  padding: '2px 7px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 500,
  color: c.baseText,
  background: c.input.backgroundColor,
});

export const danger = style({
  selectors: {'&:not([data-disabled])': {color: 'rgb(239 68 68)'}},
});

export const empty = style({
  padding: '8px 12px',
  fontSize: themeVars.fontSize.sm,
  color: c.descriptionTextColor,
});

export const limit = style({
  padding: '2px 12px 6px',
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.4,
  color: c.descriptionTextColor,
});

// Naming: the field, Save, and a small cancel, in the trigger's place.
export const naming = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  minWidth: 0,
});

export const namingField = style({flex: 1, minWidth: 0});

const press = {
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&:focus-visible': focusRing,
    '&:active:not(:disabled)': {transform: 'scale(0.97)'},
  },
  '@media': {[reducedMotion]: {transition: 'none'}},
} as const;

export const confirm = style({
  all: 'unset',
  boxSizing: 'border-box',
  flexShrink: 0,
  height: '32px',
  padding: '0 12px',
  borderRadius: themeVars.borderRadius.lg,
  background: c.primary,
  color: '#fff',
  fontSize: themeVars.fontSize.sm,
  fontWeight: 500,
  cursor: 'pointer',
  ...press,
  selectors: {
    ...press.selectors,
    '&:disabled': {opacity: 0.5, cursor: 'default'},
  },
});

export const cancel = style({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  color: c.descriptionTextColor,
  cursor: 'pointer',
  ...press,
  '@media': {
    ...press['@media'],
    [finePointer]: {selectors: {'&:hover': {color: c.baseText}}},
  },
});
