import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';

export const [terminalTheme, terminalVars] = createTheme({
  headerHeight: '50px',
  headerBackgroundColor: themeVars.backgroundColor.white,
  backgroundColor: themeVars.backgroundColor.white,
  textColor: themeVars.backgroundColor.gray['800'],
  boxShadow: themeVars.boxShadow.lg,
  iconFill: themeVars.backgroundColor.black,
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    color: terminalVars.textColor,
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: terminalVars.boxShadow,
    transition: 'box-shadow .2s',
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
    '[data-theme-mode=light] &[data-accent-visible=true]': {
      backgroundColor: `rgba(0, 0, 0, .06)`,
    },
    '[data-theme-mode=dark] &[data-accent-visible=true]': {
      backgroundColor: `rgba(255, 255, 255, .06)`,
    },
  },
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
        [terminalVars.iconFill]: themeVars.backgroundColor.black,
      },
    },
    [`${header}[data-theme-mode=dark] &`]: {
      vars: {
        [terminalVars.iconFill]: themeVars.backgroundColor.white,
      },
    },
  },
});

export const headerIconRowItem = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '10px',
      height: '10px',
      color: terminalVars.iconFill,
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
    marginLeft: themeVars.spacing['5'],
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
        boxShadow: `1px 0px 0px 0px ${terminalVars.backgroundColor}, 3px 4px 0px 0px ${terminalVars.backgroundColor}`,
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
        boxShadow: `1px 0px 0px 0px ${terminalVars.backgroundColor}, 3px 4px 0px 0px ${terminalVars.backgroundColor}`,
        overflow: 'hidden',
        borderBottomRightRadius: '12px',
        transform: 'scaleX(-1)',
      },
    },
  },
]);
