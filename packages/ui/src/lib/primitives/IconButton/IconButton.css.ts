import {recipe} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';
import {buttonHeight as btnSize, ButtonSizes} from '../Button/Button.css';
import * as variables from '../../theme/variables.css';

export const iconButton = recipe({
  base: {
    width: btnSize,
    height: btnSize,
    padding: 0,
    textAlign: 'center',
    minWidth: btnSize,
    maxWidth: btnSize,
  },
  variants: {
    size: {
      [ButtonSizes.xxs]: {
        vars: {[variables.fontSize]: themeVars.fontSize.xs},
      },
      [ButtonSizes.xs]: {
        vars: {[variables.fontSize]: themeVars.fontSize.base},
      },
      [ButtonSizes.sm]: {
        vars: {[variables.fontSize]: themeVars.fontSize.lg},
      },
      [ButtonSizes.md]: {
        vars: {[variables.fontSize]: themeVars.fontSize.xl},
      },
      [ButtonSizes.lg]: {
        vars: {[variables.fontSize]: themeVars.fontSize['2xl']},
      },
    },
  },
});
