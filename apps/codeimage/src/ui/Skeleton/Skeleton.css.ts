import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createTheme, fallbackVar, keyframes, style} from '@vanilla-extract/css';

export const [skeletonTheme, skeletonVars] = createTheme({
  startBackground: '#000',
  midBackground: '#000',
  lineWidth: '100%',
  lineHeight: '16px',
  radius: '4px',
});

export const shimmer = keyframes({
  '0%': {
    backgroundPosition: '-450px 0',
  },
  '100%': {
    backgroundPosition: '450px 0',
  },
});

export const withSkeletonItem = style([
  skeletonTheme,
  {
    overflow: 'hidden',
    position: 'relative',

    selectors: {
      ...withThemeMode({
        light: {
          vars: {
            [skeletonVars.startBackground]:
              themeVars.backgroundColor.gray['300'],
            [skeletonVars.midBackground]: themeVars.backgroundColor.gray['400'],
          },
        },
        dark: {
          vars: {
            [skeletonVars.startBackground]: darkGrayScale.gray4,
            [skeletonVars.midBackground]: darkGrayScale.gray6,
          },
        },
      }),
    },
    ':before': {
      position: 'absolute',
      content: '',
      height: '100%',
      width: '100%',
      background: skeletonVars.startBackground,
      backgroundImage: `linear-gradient(to right, ${skeletonVars.startBackground} 0%, ${skeletonVars.midBackground} 20%, ${skeletonVars.startBackground} 40%, ${skeletonVars.startBackground} 100%)`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '800px 104px',
      animation: `${shimmer} 1s linear infinite`,
      animationFillMode: 'forwards',
      animationDelay: '0.2s',
    },
  },
]);

export const skeletonLine = style([
  withSkeletonItem,
  {
    borderRadius: fallbackVar(skeletonVars.radius, '4px'),
    height: skeletonVars.lineHeight,
    width: skeletonVars.lineWidth,
  },
]);

export const skeletonDivider = style({
  height: skeletonVars.lineHeight,
  width: '100%',
  backgroundColor: 'transparent',
  overflow: 'hidden',
  position: 'relative',
});
