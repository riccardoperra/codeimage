import {backgroundColorVar, colorVar, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const editor = style({
  boxShadow: themeVars.boxShadow.lg,
  backgroundColor: backgroundColorVar,
  color: colorVar,
  padding: themeVars.spacing['4'],
  borderRadius: themeVars.borderRadius.lg,
  overflowY: 'auto',
});
