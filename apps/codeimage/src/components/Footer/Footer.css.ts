import {style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const wrapper = style({
  position: 'absolute',
  bottom: 0,
  right: 0,
  zIndex: themeVars.zIndex['20'],
  color: themeVars.dynamicColors.descriptionTextColor,
  width: 'auto',
});

export const link = style({
  userSelect: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
  selectors: {
    '&:not([href])': {
      cursor: 'default',
    },
  },
});
