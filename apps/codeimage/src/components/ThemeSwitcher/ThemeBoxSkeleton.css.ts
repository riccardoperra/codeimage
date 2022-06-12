import {backgroundColorVar} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../theme/dark-theme.css';
import {themeBox} from './ThemeSwitcher.css';

export const wrapper = style([
  themeBox,
  {
    vars: {
      [backgroundColorVar]: `${darkGrayScale.gray2}`,
    },
  },
]);

export const shimmer = keyframes({
  '0%': {
    backgroundPosition: '-450px 0',
  },
  '100%': {
    backgroundPosition: '450px 0',
  },
});

export const content = style({
  padding: '20px',
});

export const withShimmerAnimation = style({
  position: 'relative',

  ':before': {
    position: 'absolute',
    content: '',
    height: '100%',
    width: '100%',
    background: darkGrayScale.gray4,
    backgroundImage: `linear-gradient(to right, ${darkGrayScale.gray4} 0%, ${darkGrayScale.gray6} 20%, ${darkGrayScale.gray4} 40%, ${darkGrayScale.gray4} 100%)`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '800px 104px',
    animation: `${shimmer} 1s linear infinite`,
    animationFillMode: 'forwards',
    animationDelay: '0.2s',
  },
});

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
  square: style([
    withShimmerAnimation,
    {
      height: '40px',
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
      height: '6px',
      width: '90%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
  line2: style([
    withShimmerAnimation,
    {
      height: '6px',
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
      height: '6px',
      width: '75%',
      background: darkGrayScale.gray6,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    },
  ]),
};
