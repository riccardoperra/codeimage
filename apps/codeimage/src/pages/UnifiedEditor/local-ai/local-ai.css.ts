import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 109,
  background: c.dialog.overlayBackgroundColor,
});

export const content = style({
  position: 'fixed',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['4'],
  boxSizing: 'border-box',
  width: 'min(560px, calc(100vw - 32px))',
  maxHeight: 'calc(100dvh - 32px)',
  overflowY: 'auto',
  zIndex: 110,
  padding: themeVars.spacing['5'],
  borderRadius: themeVars.borderRadius.xl,
  background: c.panel.background,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const title = style({
  margin: 0,
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
});

export const intro = style({
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
});

export const request = style({minHeight: '112px'});

export const actions = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['3'],
});

export const status = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  minWidth: 0,
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
});

export const error = style({color: c.button.danger.backgroundColor});

// The steps as one island, as the settings draw their rows.
export const steps = style({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: '6px 0',
  listStyle: 'none',
  borderRadius: '16px',
  background: c.background,
  selectors: {'&:empty': {display: 'none'}},
});

export const step = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: themeVars.spacing['3'],
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['4']}`,
  fontSize: themeVars.fontSize.sm,
  selectors: {'&[data-ok=false]': {color: c.button.danger.backgroundColor}},
});

export const tool = style({
  flex: 'none',
  fontFamily: 'ui-monospace, monospace',
  fontSize: themeVars.fontSize.xs,
});
