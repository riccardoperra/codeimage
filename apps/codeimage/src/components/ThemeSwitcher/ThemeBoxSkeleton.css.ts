import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../theme/dark-theme.css';
import {themeBox} from './ThemeSwitcher.css';

export const wrapper = style([
  themeBox,
  {
    selectors: {
      '[data-codeimage-theme=light] &': {
        vars: {
          [backgroundColorVar]: themeVars.backgroundColor.gray['100'],
        },
      },
      '[data-codeimage-theme=dark] &': {
        vars: {
          [backgroundColorVar]: darkGrayScale.gray2,
        },
      },
    },
  },
]);

export const content = style({
  padding: '20px',
});
