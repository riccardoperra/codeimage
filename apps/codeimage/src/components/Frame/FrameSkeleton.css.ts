import {themeVars} from '@codeimage/ui';
import {withSkeletonItem} from '@ui/Skeleton/Skeleton.css';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../theme/dark-theme.css';
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
    selectors: {
      '[data-codeimage-theme=light] &': {
        backgroundColor: themeVars.backgroundColor.gray['100'],
      },
      '[data-codeimage-theme=dark] &': {
        backgroundColor: darkGrayScale.gray3,
      },
    },
  },
]);

export const terminal = {
  base: style([
    terminalStyle.terminalTheme,
    {
      selectors: {
        '[data-codeimage-theme=light] &': {
          backgroundColor: themeVars.backgroundColor.gray['200'],
        },
        '[data-codeimage-theme=dark] &': {
          background: darkGrayScale.gray2,
        },
      },
    },
  ]),
  header: style([
    withSkeletonItem,
    {
      height: terminalStyle.terminalVars.headerHeight,
      selectors: {
        '[data-codeimage-theme=light] &': {
          backgroundColor: themeVars.backgroundColor.gray['400'],
        },
        '[data-codeimage-theme=dark] &': {
          background: darkGrayScale.gray6,
        },
      },
    },
  ]),
  content: style({
    padding: '24px',
  }),
};
