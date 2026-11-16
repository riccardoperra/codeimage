import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const duplicate = style({
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
});
export const hint = style({
  maxWidth: 240,
  whiteSpace: 'normal',
  color: themeVars.dynamicColors.baseText,
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.5,
});
