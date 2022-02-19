import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {header} from '../terminal.css';

export const [theme, vars] = createTheme({
  iconFill: themeVars.backgroundColor.black,
});

export const headerIconRow = style({
  selectors: {
    [`${header} &`]: {
      display: 'flex',
      marginLeft: 'auto',
      paddingInlineStart: themeVars.spacing['4'],
      paddingInlineEnd: themeVars.spacing['4'],
      columnGap: themeVars.spacing['5'],
    },
    [`${header}[data-theme-mode=light] &`]: {
      vars: {
        [vars.iconFill]: themeVars.backgroundColor.black,
      },
    },
    [`${header}[data-theme-mode=dark] &`]: {
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
