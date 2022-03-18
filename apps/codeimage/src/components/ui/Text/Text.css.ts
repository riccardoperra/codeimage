import {themeVars} from '../../../theme/global.css';
import {style, styleVariants} from '@vanilla-extract/css';
import {mapToProperty} from '../utils/mapToProperty';

export const fontWeight = styleVariants(
  themeVars.fontWeight,
  mapToProperty('fontWeight'),
);

export const fontSize = styleVariants(
  themeVars.fontSize,
  mapToProperty('fontSize'),
);

export const baseText = style({
  fontFamily: 'inherit',
});
