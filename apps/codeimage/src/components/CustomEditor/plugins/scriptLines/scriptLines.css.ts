import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const ghost = style({opacity: 0.28});
export const entering = style({
  boxShadow: `inset 3px 0 0 ${themeVars.dynamicColors.primary}`,
});
export const focused = style({
  backgroundColor: themeVars.backgroundColor.gray['500'],
});
export const badgeAnchor = style({
  position: 'relative',
  display: 'inline-block',
  width: 0,
  height: '1em',
  verticalAlign: 'middle',
  pointerEvents: 'none',
  userSelect: 'none',
});
export const badge = style({
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '0 5px',
  borderRadius: 4,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 10,
  lineHeight: '15px',
  whiteSpace: 'nowrap',
  color: themeVars.dynamicColors.primary,
  boxShadow: `inset 0 0 0 1px ${themeVars.dynamicColors.primary}`,
  opacity: 0.85,
});
