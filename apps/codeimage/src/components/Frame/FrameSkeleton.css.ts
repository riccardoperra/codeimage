import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../theme/dark-theme.css';
import * as terminalStyle from '../Terminal/terminal.css';
import {withShimmerAnimation} from '../ThemeSwitcher/ThemeBoxSkeleton.css';

export const wrapper = style([
  {
    backgroundColor: darkGrayScale.gray3,
    padding: '32px',
    opacity: '100%',
    width: '600px',
    visibility: 'visible',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
    userSelect: 'none',
  },
]);

export const terminal = {
  base: style([
    terminalStyle.terminalTheme,
    {
      background: darkGrayScale.gray2,
    },
  ]),
  header: style([
    withShimmerAnimation,
    {
      background: darkGrayScale.gray6,
      height: terminalStyle.terminalVars.headerHeight,
    },
  ]),
  content: style({
    padding: '24px',
  }),
};

export const skeleton = {
  rectangle: style([
    withShimmerAnimation,
    {
      height: '60px',
      width: '100%',
      background: darkGrayScale.gray6,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
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
  squareBox: style({}),
  squareLine1: style([
    withShimmerAnimation,
    {
      display: 'inline-block',
      width: '65%',
      background: darkGrayScale.gray6,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  squareLine2: style([
    withShimmerAnimation,
    {
      display: 'inline-block',
      width: '65%',
      background: darkGrayScale.gray6,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  square: style([
    withShimmerAnimation,
    {
      height: '40px',
      display: 'inline-block',
      width: '40px',
      background: darkGrayScale.gray6,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  divider: style([
    {
      height: '13px',
      width: '100%',
      backgroundColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  divider2: style([
    {
      height: '20px',
      width: '100%',
      backgroundColor: 'transparent',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line1: style([
    withShimmerAnimation,
    {
      height: '16px',
      width: '95%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line2: style([
    withShimmerAnimation,
    {
      height: '16px',
      width: '80%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line3: style([
    withShimmerAnimation,
    {
      height: '16px',
      width: '75%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line4: style([
    withShimmerAnimation,
    {
      height: '16px',
      width: '55%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line5: style([
    withShimmerAnimation,
    {
      height: '16px',
      width: '50%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
};
