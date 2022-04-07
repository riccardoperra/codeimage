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
});
