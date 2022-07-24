import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const menuList = style({
  boxShadow: themeVars.boxShadow.md,
  backgroundColor: themeVars.dynamicColors.listBox.panelBackground,
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.md,
  zIndex: themeVars.zIndex['40'],
  listStyleType: 'none',
  padding: themeVars.spacing['2'],
  display: 'flex',
  flexDirection: 'column',
  rowGap: themeVars.spacing['1'],
});
