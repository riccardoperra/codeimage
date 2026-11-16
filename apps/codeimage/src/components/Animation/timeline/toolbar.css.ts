import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {curve} from '../../WhatsNew/motion';
import {durationSteppers, field, number} from '../AnimatePanel.css';
import {curve as curveSvg} from '../easing.css';

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

globalStyle(
  `${toolbar} [data-cui="button"], ${toolbar} [data-cui="icon-button"]`,
  {
    minHeight: 28,
    '@media': {[phone]: {minHeight: 40, minWidth: 40}},
  },
);

export const segmented = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  padding: 2,
  borderRadius: themeVars.borderRadius.lg,
  background: c.background,
});
export const segment = style({
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
});
globalStyle(`${segment} svg`, {width: 14, height: 14, flexShrink: 0});

globalStyle(`${toolbar} ${number}`, {
  width: 150,
  '@media': {[phone]: {width: 150}},
});
globalStyle(`${toolbar} ${number} input`, {
  height: 32,
  paddingRight: 64,
  '@media': {[phone]: {height: 40, paddingRight: 84}},
});
globalStyle(`${toolbar} ${durationSteppers}`, {flexDirection: 'row', gap: 2});
globalStyle(`${toolbar} ${durationSteppers} button`, {
  width: 28,
  minWidth: 28,
  height: 28,
  minHeight: 28,
  '@media': {[phone]: {width: 40, minWidth: 40, height: 40, minHeight: 40}},
});
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
globalStyle(`${chipPopover} > p`, {gap: 10});
globalStyle(`${chipPopover} ${field}`, {justifyContent: 'space-between'});
globalStyle(`${chipPopover} ${field} label`, {
  whiteSpace: 'nowrap',
  color: c.descriptionTextColor,
});
globalStyle(`${chipPopover} ${number}`, {width: 120, flex: 'none'});
globalStyle(`${chipPopover} ${number} input`, {height: 28, fontSize: 13});
globalStyle(`${chipPopover} [role="tab"]`, {fontSize: 12});
globalStyle(`${chipPopover} ${curveSvg}`, {height: 88});
globalStyle(`${chipPopover} > p > [data-cui="button"]`, {
  minHeight: 28,
  height: 28,
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
globalStyle(`${menu} [role="menuitem"]`, {
  minHeight: 32,
  padding: '0 10px',
  borderRadius: themeVars.borderRadius.md,
  fontSize: 13,
  gap: 8,
  '@media': {[phone]: {minHeight: 40}},
});
globalStyle(`${menu} [role="menuitem"] svg`, {
  width: 14,
  height: 14,
  flexShrink: 0,
  opacity: 0.7,
});
globalStyle(`${menu} hr, ${menu} [role="separator"]`, {
  height: 0,
  margin: '5px 4px',
  border: 0,
  borderTop: `1px solid ${c.divider}`,
  background: 'none',
  opacity: 1,
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
globalStyle(`${danger}:not([data-disabled]) svg`, {opacity: 1});

globalStyle(
  `${chipPopover} ${number} input, ${chipPopover} > p > [data-cui="button"]`,
  {'@media': {[phone]: {minHeight: 40, height: 40}}},
);

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
globalStyle(`${sheet} h2`, {margin: 0, fontSize: 14});
globalStyle(
  `${sheet} [data-cui="button"], ${sheet} [data-cui="icon-button"], ${sheet} input`,
  {minHeight: 40},
);

globalStyle(`[data-animate-input="keyboard"] ${segment}`, {
  transition: 'none',
  animation: 'none',
});
