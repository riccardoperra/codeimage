import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {backgroundColorVar} from '../../theme/variables.css';

export const [terminalTheme, terminalVars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
  backgroundColor: themeVars.backgroundColor.gray['100'],
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    overflow: 'hidden',
    borderRadius: themeVars.borderRadius.lg,
    boxShadow: themeVars.boxShadow.lg,
  },
]);

export const content = style({
  position: 'relative',
  overflow: 'auto',
  fontSize: themeVars.fontSize.base,
  paddingBottom: themeVars.spacing['4'],
  paddingTop: themeVars.spacing['5'],
  paddingInlineStart: themeVars.spacing['4'],
  paddingInlineEnd: themeVars.spacing['4'],
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: '50px',
  backgroundColor: themeVars.backgroundColor.white,
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
