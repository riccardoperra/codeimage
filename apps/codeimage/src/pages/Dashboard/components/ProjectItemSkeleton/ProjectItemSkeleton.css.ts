import {backgroundColorVar, themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {item} from '../ProjectItem/ProjectItem.css';

export const itemSkeleton = style([
  item,
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
