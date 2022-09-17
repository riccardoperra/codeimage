import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const pagination = style({
  display: 'flex',
  gap: themeVars.spacing[2],
});
