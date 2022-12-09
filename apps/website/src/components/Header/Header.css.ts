import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createTheme, createVar, style} from '@vanilla-extract/css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: '56px',
});

const headerBorderColor = createVar();

export const header = style([
  toolbarTheme,
  {
    vars: {
      [headerBorderColor]: 'rgba(0,0,0,0)',
    },
    display: 'flex',
    position: 'fixed',
    width: '100%',
    height: toolbarVars.toolbarHeight,
    zIndex: themeVars.zIndex['50'],
    borderBottom: `1px solid ${headerBorderColor}`,
    transition: 'border-color 250ms ease-in-out',
    selectors: {
      '&[data-scrolled=true]': {
        backgroundColor: `rgba(12, 12, 12, 0.6)`,
        backdropFilter: 'saturate(180%) blur(20px)',
        // @ts-expect-error: Why not working
        '-webkitBackdropFilter': 'saturate(180%) blur(20px)',
        vars: {
          [headerBorderColor]: themeVars.dynamicColors.divider,
        },
        borderColor: themeVars.dynamicColors.divider,
      },
    },
  },
]);

export const headerContent = style({
  width: '100%',
  margin: 'auto',
  display: 'flex',
  alignItems: 'center',
  '@media': {
    [`(min-width: 1280px)`]: {
      width: '1280px',
    },
  },
});

export const headerContentInner = style({
  display: 'flex',
  alignItems: 'center',
  flexGrow: 1,
  marginLeft: themeVars.spacing['5'],
  marginRight: themeVars.spacing['5'],
});

export const headerActions = style({
  marginLeft: 'auto',
});
