import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const dialogLeftPanel = style({
  flex: '0 0 20%',
  borderRight: `1px solid ${themeVars.dynamicColors.dialog.titleBorderColor}`,
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
  marginRight: themeVars.spacing['12'],
});

export const dialogContent = style({
  flex: 1,
  width: '100%',
  minWidth: '0px',
  '@media': {
    'screen and (max-width: 768px)': {
      width: '80vw',
    },
  },
});
