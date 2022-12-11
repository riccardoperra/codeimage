import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createTheme, createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: '56px',
});

const headerBorderColor = createVar();

export const headerBgColor = createVar();

export const header = style([
  toolbarTheme,
  {
    vars: {
      [headerBorderColor]: 'rgba(0,0,0,0)',
      [headerBgColor]: 'rgba(12, 12, 12, 0.6)',
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
        backgroundColor: headerBgColor,
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
  gap: themeVars.spacing[2],
  display: 'flex',
});

export const loginButton = style({
  cursor: 'pointer',
  boxShadow: themeVars.boxShadow.lg,
  border: `1px solid rgba(255, 255, 255, 0.08)`,
  backgroundColor: darkGrayScale.gray1,
  selectors: {
    '&:hover': {
      backgroundColor: darkGrayScale.gray2,
    },
  },
});

export const gettingStartedBtn = style([
  {
    boxShadow: themeVars.boxShadow.lg,
  },
  responsiveStyle({
    mobile: {display: 'none'},
    tablet: {display: 'inline-flex'},
  }),
]);
