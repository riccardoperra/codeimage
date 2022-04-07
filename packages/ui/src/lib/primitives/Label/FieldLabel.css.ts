import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const label = style({
  color: themeVars.dynamicColors.input.labelTextColor,
  marginBottom: themeVars.margin['3'],
});

export const labelHintWrapper = style({
  display: 'inline-flex',
  alignItems: 'center',
  color: themeVars.dynamicColors.input.labelTextHintColor,
});

export const labelHint = style({
  color: themeVars.dynamicColors.input.labelTextHintColor,
});
