import {textFieldStyles, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const input = style([
  textFieldStyles.baseField,
  {
    paddingLeft: themeVars.spacing['2'],
    paddingRight: themeVars.spacing['2'],
    flex: 1,
    justifyContent: 'space-between',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
  },
]);

export const inputIcon = style({
  flexShrink: 0,
});
