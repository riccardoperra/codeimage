import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
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

export const frameToolbar = style({
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '10px',
  borderTopLeftRadius: themeVars.borderRadius.lg,
  borderTopRightRadius: themeVars.borderRadius.lg,
  borderBottomLeftRadius: themeVars.borderRadius.lg,
  borderBottomRightRadius: themeVars.borderRadius.lg,
  height: '50px',
  selectors: {
    ...withThemeMode({
      dark: {
        background: `${darkGrayScale.gray1}`,
        boxShadow: themeVars.boxShadow.lg,
      },
      light: {
        background: themeVars.backgroundColor.gray['400'],
      },
    }),
  },
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  borderRadius: '15px',
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
