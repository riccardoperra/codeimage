import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const host = style({
  width: '0px',
  height: '0px',
  zIndex: themeVars.zIndex['40'],
});
