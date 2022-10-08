import {backgroundColorVar, themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {themeBox} from './ThemeSwitcher.css';

export const wrapper = style([
  themeBox,
  {
    selectors: {
      ...withThemeMode({
        light: {
          vars: {
            [backgroundColorVar]: themeVars.backgroundColor.gray['100'],
          },
        },
        dark: {
          vars: {
            [backgroundColorVar]: darkGrayScale.gray2,
          },
        },
      }),
    },
  },
]);

export const content = style({
  padding: '20px',
});
