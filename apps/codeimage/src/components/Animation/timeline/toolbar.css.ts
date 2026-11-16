import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';
import {curve} from '../../WhatsNew/motion';

const c = themeVars.dynamicColors;
const phone = '(max-width: 768px)';

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  minHeight: 40,
  fontSize: 13,
});
export const label = style({
  fontWeight: 600,
  whiteSpace: 'nowrap',
  minWidth: 0,
});
export const muted = style({opacity: 0.7, fontSize: 12, whiteSpace: 'nowrap'});
export const spacer = style({flex: 1});
export const divider = style({
  width: 1,
  alignSelf: 'stretch',
  margin: '6px 0',
  background: c.divider,
});
export const group = style({display: 'flex', alignItems: 'center', gap: 8});

export const segmented = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  padding: 2,
  borderRadius: themeVars.borderRadius.lg,
  background: c.background,
});
export const segment = style([
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    border: 0,
    borderRadius: themeVars.borderRadius.md,
    background: 'transparent',
    color: c.baseText,
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    transition: `transform 160ms ${curve.out}`,
    selectors: {
      '&[aria-pressed="true"]': {
        background: c.primary,
        color: themeVars.backgroundColor.white,
      },
      '&:disabled': {opacity: 0.4, cursor: 'default'},
      '&:not(:disabled):active': {transform: 'scale(0.97)'},
      '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: 1},
    },
    '@media': {
      [phone]: {height: 40, padding: '0 12px'},
      '(hover: hover) and (pointer: fine)': {
        selectors: {
          '&:not(:disabled):not([aria-pressed="true"]):hover': {
            background: c.panel.background,
          },
        },
      },
    },
  },
  {
    selectors: {
      '[data-animate-input="keyboard"] &': {
        transition: 'none',
        animation: 'none',
      },
    },
  },
]);

const grow = keyframes({
  from: {opacity: 0, transform: 'scale(0.96)'},
  to: {opacity: 1, transform: 'scale(1)'},
});
const shrink = keyframes({
  from: {opacity: 1, transform: 'scale(1)'},
  to: {opacity: 0, transform: 'scale(0.96)'},
});
const reducedFade = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const surface = {
  transformOrigin: 'var(--kb-popper-content-transform-origin)',
  animation: `${shrink} 120ms ${curve.out} forwards`,
  selectors: {
    '&[data-expanded]': {animation: `${grow} 180ms ${curve.out}`},
    '[data-animate-input="keyboard"] &': {animation: 'none'},
    '[data-animate-input="keyboard"] &[data-expanded]': {animation: 'none'},
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: `${reducedFade} 120ms linear reverse forwards`,
      selectors: {
        '&[data-expanded]': {animation: `${reducedFade} 120ms linear`},
      },
    },
  },
} as const;
export const chipPopover = style({
  ...surface,
  width: 300,
  padding: 12,
  fontSize: 13,
});

export const menu = style({
  ...surface,
  minWidth: 220,
  padding: 6,
  rowGap: 1,
  fontSize: 13,
  color: c.baseText,
});

export const menuLabel = style({
  padding: '6px 10px 2px',
  fontSize: 11,
  fontWeight: 500,
  color: c.descriptionTextColor,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 260,
});
export const danger = style({
  selectors: {
    '&&:not([data-disabled])': {color: themeVars.backgroundColor.red['400']},
  },
});

export const sheetOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 43,
  background: c.dialog.overlayBackgroundColor,
});
export const sheet = style({
  position: 'fixed',
  zIndex: 44,
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: '85dvh',
  overflowY: 'auto',
  padding: '16px 16px max(16px, env(safe-area-inset-bottom))',
  display: 'grid',
  gap: 16,
  borderRadius: `${themeVars.borderRadius.xl} ${themeVars.borderRadius.xl} 0 0`,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  fontSize: themeVars.fontSize.sm,
});
export const sheetHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});

export const button = style({
  selectors: {
    '[data-step-toolbar] &': {
      minHeight: 28,
      '@media': {[phone]: {minHeight: 40, minWidth: 40}},
    },
    '[data-animation-step-sheet] &': {minHeight: 40},
  },
});
export const actionIcon = style({width: 14, height: 14, flexShrink: 0});
export const menuItem = style({
  selectors: {
    '[data-animation-steps-menu] &': {
      minHeight: 32,
      padding: '0 10px',
      borderRadius: themeVars.borderRadius.md,
      fontSize: 13,
      gap: 8,
      '@media': {[phone]: {minHeight: 40}},
    },
  },
});
export const menuIcon = style({
  width: 14,
  height: 14,
  flexShrink: 0,
  opacity: 0.7,
  selectors: {'[data-menu-danger]:not([data-disabled]) &': {opacity: 1}},
});
export const menuSeparator = style({
  selectors: {
    '[data-animation-steps-menu] &': {
      height: 0,
      margin: '5px 4px',
      border: 0,
      borderTop: `1px solid ${c.divider}`,
      background: 'none',
      opacity: 1,
    },
  },
});
export const sheetTitle = style({margin: 0, fontSize: 14});
