import {themeVars} from '../../../theme/global.css';
import {styleVariants} from '@vanilla-extract/css';
import {mapToProperty} from '../utils/mapToProperty';

export const fontWeight = styleVariants(
  themeVars.fontWeight,
  mapToProperty('fontWeight'),
);

export const fontSize = styleVariants(
  themeVars.fontSize,
  mapToProperty('fontSize'),
);
