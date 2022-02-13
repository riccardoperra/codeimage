import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {backgroundColorVar} from '../../theme/variables.css';

export const [terminalTheme, terminalVars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
  headerHeight: '50px',
  headerBackgroundColor: themeVars.backgroundColor.white,
  backgroundColor: themeVars.backgroundColor.white,
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    overflow: 'hidden',
    borderRadius: '12px',
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
  height: terminalVars.headerHeight,
  transition: 'background-color .2s ease-in-out',

  selectors: {
    '&[data-accent-visible=true]': {
      backgroundColor: `rgba(0, 0, 0, .06)`,
    },
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

export const tab = style([
  {
    backgroundColor: terminalVars.backgroundColor,
    height: `calc(${terminalVars.headerHeight} - 10px)`,
    alignSelf: 'flex-end',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${themeVars.spacing['3']}`,
    fontSize: themeVars.fontSize.sm,
    borderRadius: `${themeVars.borderRadius.md} ${themeVars.borderRadius.md} 0 0`,
    position: 'relative',

    // TODO: clean up code

    selectors: {
      [`${header}[data-accent-visible=true] &:before`]: {
        content: '',
        display: 'block',
        position: 'absolute',
        bottom: 0,
        left: '-8px',
        backgroundColor: 'transparent',
        width: '8px',
        height: '8px',
        boxShadow: '1px 0px 0px 0px #ffffff, 3px 4px 0px 0px #fff',
        overflow: 'hidden',
        borderBottomRightRadius: '8px',
      },
      [`${header}[data-accent-visible=true] &:after`]: {
        content: '',
        display: 'block',
        position: 'absolute',
        bottom: 0,
        right: '-8px',
        backgroundColor: 'transparent',
        width: '8px',
        height: '8px',
        boxShadow: '1px 0px 0px 0px #ffffff, 3px 4px 0px 0px #fff',
        overflow: 'hidden',
        borderBottomRightRadius: '12px',
        transform: 'scaleX(-1)',
      },
    },
  },
]);
