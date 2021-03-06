import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const snackbar = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: themeVars.dynamicColors.snackbar.backgroundColor,
  color: themeVars.dynamicColors.snackbar.textColor,
  borderRadius: themeVars.borderRadius.xl,
  padding: themeVars.spacing['3'],
});

export const hostWrapper = style({
  position: 'absolute',
  left: '50%',
  bottom: 0,
  transform: 'translateX(-50%)',
  padding: themeVars.spacing['4'],
  zIndex: themeVars.zIndex['40'],

  '@media': {
    'screen and (max-width: 768px)': {
      width: '100%',
      bottom: '40px',
    },
  },
});

export const host = style({
  display: 'flex',
  flexDirection: 'column',
  rowGap: themeVars.spacing['2'],
  overflow: 'hidden',
});
