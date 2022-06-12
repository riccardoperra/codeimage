import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../theme/dark-theme.css';
import {withShimmerAnimation} from '../ThemeSwitcher/ThemeBoxSkeleton.css';

export const wrapper = style({
  height: '50px',
  display: 'flex',
  paddingLeft: themeVars.spacing['2'],
  paddingRight: themeVars.spacing['2'],
  borderRadius: themeVars.borderRadius.md,
  alignItems: 'center',
});

export const skeleton = {
  rectangle2: style([
    withShimmerAnimation,
    {
      height: '20px',
      width: '100%',
      background: darkGrayScale.gray6,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
};
