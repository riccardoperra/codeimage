import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const badge = style({
  backgroundColor: themeVars.backgroundColor.green['600'],
  color: themeVars.backgroundColor.white,
  overflow: 'hidden',
});
