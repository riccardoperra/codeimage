import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const ghost = style({opacity: 0.28});
export const entering = style({
  boxShadow: `inset 3px 0 0 ${themeVars.dynamicColors.primary}`,
});
export const focused = style({
  backgroundColor: themeVars.backgroundColor.gray['500'],
});
