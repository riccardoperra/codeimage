import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
export const host = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  pointerEvents: 'auto',
  borderRadius: themeVars.borderRadius.xl,
  background: themeVars.dynamicColors.panel.background,
});
globalStyle(`${host} > button`, {
  minHeight: '36px',
  minWidth: '36px',
  padding: themeVars.spacing['2'],
  '@media': {'(max-width: 768px)': {minHeight: '40px', minWidth: '40px'}},
});
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 109,
  background: themeVars.dynamicColors.dialog.overlayBackgroundColor,
});
export const content = style({
  position: 'fixed',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  maxHeight: 'calc(100dvh - 32px)',
  width: 'min(620px, calc(100vw - 24px))',
  overflowY: 'auto',
  zIndex: 110,
  background: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
  borderRadius: themeVars.borderRadius.xl,
  padding: themeVars.spacing['4'],
  boxShadow: themeVars.dynamicColors.dialog.panelShadow,
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.semibold,
});
export const list = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: `0 ${themeVars.spacing['4']}`,
  gridAutoRows: 'minmax(40px, auto)',
  margin: 0,
});
export const keys = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.spacing['1'],
  margin: 0,
});
