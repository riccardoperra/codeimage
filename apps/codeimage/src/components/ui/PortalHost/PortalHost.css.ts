import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

export const host = style({
  position: 'relative',
  width: '0px',
  height: '0px',
  zIndex: themeVars.zIndex['40'],
});
