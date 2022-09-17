import {textStyles, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const title = style([
  textStyles.fontSize['2xl'],
  textStyles.fontWeight.medium,
]);

export const container = style({
  marginBottom: themeVars.spacing['6'],

  '@media': {
    'screen and (max-width: 768px)': {
      marginBottom: themeVars.spacing['2'],
    },
  },
});
