import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {backgroundColorVar} from '../../theme/variables.css';

export const [terminalTheme, terminalVars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
  backgroundColor: themeVars.backgroundColor.gray['800'],
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    overflow: 'hidden',
    minWidth: '300px',
    borderRadius: themeVars.borderRadius.lg,
  },
]);

export const content = style({
  position: 'relative',
  overflow: 'auto',
  color: themeVars.textColor.black,
  fontSize: themeVars.fontSize.base,
  paddingBottom: themeVars.spacing['4'],
  paddingTop: themeVars.spacing['5'],
  paddingInlineStart: themeVars.spacing['4'],
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: '50px',
  backgroundColor: 'rgba(255,255,255,0.06)',
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
