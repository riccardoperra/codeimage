import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../../../theme/dark-theme.css';
import {item} from '../ProjectItem/ProjectItem.css';

export const itemSkeleton = style([
  item,
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
