import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

export const label = style({
  color: themeVars.dynamicColors.inputLabelTextColor,
  marginBottom: themeVars.margin['3'],
});
