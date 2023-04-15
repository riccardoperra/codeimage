import {backgroundColorVar, themeVars, textFieldStyles} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const inputColor = style({
  borderRadius: themeVars.borderRadius.md,
  width: themeVars.width.full,
  height: '100%',
  background: backgroundColorVar,
});

export const input = style([
  textFieldStyles.baseField,
  {
    padding: themeVars.spacing['1'],
    flex: 1,
  },
]);
