import {themeVars, withThemeMode} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';

export const [frameHandler, frameHandlerVars] = createTheme({
  scale: '1',
  emptySquareBackgroundColor: '',
});

export const wrapper = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  overflowY: 'auto',
  overflowX: 'hidden',
  flex: '1',
  alignItems: 'center',
  justifyContent: 'center',
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
});

export const handler = style([
  {
    // TODO: this is a workaround to fix gutters and cursor in mobile view
    // zoom: `${frameHandlerVars.scale}`,
    transform: `scale(${frameHandlerVars.scale})`,
    display: 'block',
    position: 'relative',
    margin: 'auto',
  },
]);

export const content = style({
  width: '100%',
  height: '100%',
  marginBottom: '40px',
  position: 'relative',
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
});
