import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {withSkeletonItem} from '@ui/Skeleton/Skeleton.css';
import {style} from '@vanilla-extract/css';
import * as terminalStyle from '../Terminal/terminal.css';

export const wrapper = style([
  {
    padding: '32px',
    opacity: '100%',
    width: '600px',
    visibility: 'visible',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
    userSelect: 'none',
    borderRadius: themeVars.borderRadius.lg,
    selectors: {
      ...withThemeMode({
        light: {
          backgroundColor: themeVars.backgroundColor.gray['100'],
        },
        dark: {
          backgroundColor: darkGrayScale.gray2,
        },
      }),
    },
  },
]);

export const terminal = {
  base: style([
    terminalStyle.terminalTheme,
    {
      borderRadius: themeVars.borderRadius.md,
      overflow: 'hidden',
      selectors: {
        ...withThemeMode({
          light: {
            backgroundColor: themeVars.backgroundColor.gray['200'],
          },
          dark: {
            backgroundColor: darkGrayScale.gray1,
            border: `1px solid ${darkGrayScale.gray3}`,
          },
        }),
      },
    },
  ]),
  header: style([
    withSkeletonItem,
    {
      height: terminalStyle.terminalVars.headerHeight,
      selectors: {
        ...withThemeMode({
          light: {
            backgroundColor: themeVars.backgroundColor.gray['400'],
          },
          dark: {
            backgroundColor: darkGrayScale.gray2,
          },
        }),
      },
    },
  ]),
  content: style({
    padding: '24px',
  }),
};
