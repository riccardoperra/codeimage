import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

export const ghost = style({opacity: 0.18});
export const dimmed = style({opacity: 0.35});
export const entering = style({
  boxShadow: `inset 3px 0 0 ${themeVars.dynamicColors.primary}`,
});
export const badge = style({
  height: 16,
  padding: '0 5px',
  borderRadius: 4,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 10,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
  color: themeVars.dynamicColors.primary,
  pointerEvents: 'none',
  userSelect: 'none',
});
globalStyle(`${badge}${badge}.cm-tooltip`, {
  border: 0,
  background: themeVars.dynamicColors.panel.background,
  boxShadow: `inset 0 0 0 1px ${themeVars.dynamicColors.primary}`,
});
