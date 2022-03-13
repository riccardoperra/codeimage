import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {backgroundColorVar} from '../../../theme/variables.css';
import {terminalVars} from '../terminal.css';

export const [theme, vars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
});

export const headerIconRow = style({
  height: terminalVars.headerHeight,
  alignItems: 'center',
  display: 'flex',
  paddingLeft: themeVars.spacing['4'],
  paddingRight: themeVars.spacing['4'],
  columnGap: themeVars.spacing['2'],
});

export const headerIconRowCircle = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '15px',
      height: '15px',
      margin: 'auto 0',
      borderRadius: themeVars.borderRadius.full,
      backgroundColor: fallbackVar(
        backgroundColorVar,
        themeVars.backgroundColor.gray['500'],
      ),
    },
  },
});
