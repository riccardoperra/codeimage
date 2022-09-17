import {themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';

export const [theme, vars] = createTheme({
  iconFill: themeVars.backgroundColor.black,
});

export const headerIconRow = style({
  display: 'flex',
  marginLeft: 'auto',
  marginTop: 'auto',
  marginBottom: 'auto',
  justifyContent: 'flex-end',
  flex: 1,
  paddingInlineStart: themeVars.spacing['4'],
  paddingInlineEnd: themeVars.spacing['4'],
  columnGap: themeVars.spacing['5'],

  selectors: {
    [`[data-theme-mode=light] &`]: {
      vars: {
        [vars.iconFill]: themeVars.backgroundColor.black,
      },
    },
    [`[data-theme-mode=dark] &`]: {
      vars: {
        [vars.iconFill]: themeVars.backgroundColor.white,
      },
    },
  },
});

export const headerIconRowItem = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '10px',
      height: '10px',
      color: vars.iconFill,
    },
  },
});
