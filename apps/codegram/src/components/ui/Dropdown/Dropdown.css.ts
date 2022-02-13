import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

export const dropdownPanel = style({
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.lg,
  backgroundColor: themeVars.backgroundColor.white,
  display: 'flex',
  flexDirection: 'column',
  width: '260px',
  boxShadow: themeVars.boxShadow.md,
});
