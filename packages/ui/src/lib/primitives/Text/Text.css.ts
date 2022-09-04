import {style, styleVariants} from '@vanilla-extract/css';
import {mapToProperty} from '../../utils/mapToProperty';
import {themeVars} from '../../theme';
import * as variables from '../../theme/variables.css';

export const fontWeight = styleVariants(
  themeVars.fontWeight,
  mapToProperty('fontWeight'),
);

export const fontSize = styleVariants(
  themeVars.fontSize,
  mapToProperty('fontSize'),
);

export const baseText = style({
  fontSize: variables.fontSize,
});
