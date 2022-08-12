import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const badge = style({
  backgroundColor: themeVars.backgroundColor.blue['600'],
  color: themeVars.backgroundColor.white,
  overflow: 'hidden',
  position: 'relative',
});

export const badgePicture = style({
  width: '100%',
  position: 'absolute',
  height: '100%',
});
