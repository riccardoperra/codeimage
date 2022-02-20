import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {backgroundColorVar} from '../../../theme/variables.css';
import {header} from '../terminal.css';

export const [theme, vars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
});

export const headerIconRow = style({
  selectors: {
    [`${header} &`]: {
      display: 'flex',
      paddingInlineStart: themeVars.spacing['4'],
      paddingInlineEnd: themeVars.spacing['4'],
      columnGap: themeVars.spacing['2'],
    },
  },
});

export const headerIconRowCircle = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '15px',
      height: '15px',
      borderRadius: themeVars.borderRadius.full,
      backgroundColor: fallbackVar(
        backgroundColorVar,
        themeVars.backgroundColor.gray['500'],
      ),
    },
  },
});
