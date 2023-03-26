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
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
});

export const wrapper = style({
  display: 'flex',
  width: '100%',
  flex: 1,
  paddingLeft: themeVars.spacing['1'],
  paddingRight: themeVars.spacing['1'],
});
