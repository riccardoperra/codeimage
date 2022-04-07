import {style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const wrapper = style({
  position: 'absolute',
  bottom: 0,
  width: '100%',
  color: themeVars.dynamicColors.descriptionTextColor,
});
