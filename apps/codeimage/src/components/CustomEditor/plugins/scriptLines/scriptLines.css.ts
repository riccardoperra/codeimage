import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const ghost = style({opacity: 0.28});
export const entering = style({
  boxShadow: `inset 3px 0 0 ${themeVars.dynamicColors.primary}`,
});
export const focused = style({
  backgroundColor: themeVars.backgroundColor.gray['500'],
});
export const badge = style({
  display: 'inline-block',
  marginLeft: 12,
  padding: '0 5px',
  borderRadius: 4,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 10,
  lineHeight: '15px',
  verticalAlign: 'middle',
  color: themeVars.dynamicColors.primary,
  boxShadow: `inset 0 0 0 1px ${themeVars.dynamicColors.primary}`,
  opacity: 0.85,
  userSelect: 'none',
  pointerEvents: 'none',
});
