import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {terminalVars} from '../terminal.css';

export const [theme, vars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
  controlSize: '15px',
});

export const headerIconRow = style({
  height: terminalVars.headerHeight,
  alignItems: 'center',
  display: 'flex',
  paddingLeft: themeVars.spacing['4'],
  columnGap: themeVars.spacing['2'],
});

export const headerIconRowCircle = style({
  selectors: {
    [`${headerIconRow}[data-lite=true] &`]: {
      vars: {
        [vars.controlSize]: '10px',
      },
    },
    [`${headerIconRow} &`]: {
      width: vars.controlSize,
      height: vars.controlSize,
      margin: 'auto 0',
      borderRadius: themeVars.borderRadius.full,
      backgroundColor: fallbackVar(
        backgroundColorVar,
        themeVars.backgroundColor.gray['500'],
      ),
    },
  },
});
