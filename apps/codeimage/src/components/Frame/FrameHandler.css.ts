import {themeVars, withThemeMode} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';

export const [frameHandler, frameHandlerVars] = createTheme({
  scale: '1',
  emptySquareBackgroundColor: '',
  borderRadius: themeVars.borderRadius.xl,
});

export const wrapper = style([
  frameHandler,
  {
    width: '100%',
    height: '100%',
    display: 'grid',
    overflow: 'auto',
    flex: '1',
    placeItems: 'center',
    zIndex: 1,
    selectors: {
      ...withThemeMode({
        dark: {
          vars: {
            [frameHandlerVars.emptySquareBackgroundColor]: '#252525',
          },
        },
        light: {
          vars: {
            [frameHandlerVars.emptySquareBackgroundColor]:
              themeVars.backgroundColor.gray['300'],
          },
        },
      }),
    },
  },
]);

export const handler = style([
  {
    display: 'block',
    justifyContent: 'center',
    position: 'relative',
    transformOrigin: 'center',
    marginBottom: '80px',
  },
]);

export const content = style({
  position: 'relative',
  width: '100%',
  height: '100%',
});

export const squaredBackgroundOverlay = style({
  backgroundImage: `
    linear-gradient(45deg,  ${frameHandlerVars.emptySquareBackgroundColor} 25%,transparent 0),
    linear-gradient(-45deg, ${frameHandlerVars.emptySquareBackgroundColor} 25%,transparent 0),
    linear-gradient(45deg,transparent 75%, ${frameHandlerVars.emptySquareBackgroundColor} 0),
    linear-gradient(-45deg,transparent 75%, ${frameHandlerVars.emptySquareBackgroundColor} 0)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0,0 10px, 10px -10px, -10px 0',
  zIndex: 1,
  position: 'absolute',
  width: '100%',
  height: '100%',
  borderRadius: frameHandlerVars.borderRadius,
});
