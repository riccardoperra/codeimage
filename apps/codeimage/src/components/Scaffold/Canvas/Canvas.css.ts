import {style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const canvas = style({
  height: '100%',
  flex: '1',
  position: 'relative',
  backgroundColor: themeVars.dynamicColors.background,
  transition: 'background-color .2s',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: '32px',
  border: `1px solid ${themeVars.dynamicColors.divider}`,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  '@media': {
    'screen and (max-width: 768px)': {
      borderTopRightRadius: 0,
    },
  },
});

export const wrapper = style({
  display: 'flex',
  width: '100%',
  flex: 1,
  overflow: 'hidden',
  paddingLeft: themeVars.spacing['1'],
  paddingRight: themeVars.spacing['1'],
  '@media': {
    'screen and (max-width: 768px)': {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
});
