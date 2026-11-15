import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

// One control in two parts: space between them, no border.
export const group = style({
  display: 'inline-flex',
  alignItems: 'stretch',
  gap: '2px',
  flex: 'none',
});

export const main = style({
  borderTopRightRadius: '4px',
  borderBottomRightRadius: '4px',
});

export const more = style({
  borderTopLeftRadius: '4px',
  borderBottomLeftRadius: '4px',
});

export const item = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
});

export const hint = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.normal,
});

export const warning = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: themeVars.spacing['3'],
});

export const confirmActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.spacing['2'],
});

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: c.dialog.overlayBackgroundColor,
});
export const confirmation = style({
  position: 'fixed',
  inset: 0,
  zIndex: 101,
  display: 'grid',
  placeItems: 'center',
  padding: themeVars.spacing['4'],
  pointerEvents: 'none',
});

export const confirmationPanel = style({
  width: 'min(448px, 100%)',
  pointerEvents: 'auto',
  padding: themeVars.spacing['4'],
  borderRadius: themeVars.borderRadius.xl,
  background: c.panel.background,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
});
