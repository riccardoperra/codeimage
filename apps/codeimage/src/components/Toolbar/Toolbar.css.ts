import {backgroundColorVar, colorVar, themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';
import {scaffoldVars} from '../Scaffold/Scaffold.css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: scaffoldVars.toolbarHeight,
});

export const toolbar = style({
  zIndex: themeVars.zIndex['10'],
});

export const wrapper = style([
  toolbarTheme,
  {
    padding: `0px ${themeVars.spacing['3']}`,
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    height: toolbarVars.toolbarHeight,
    width: '100%',
    backgroundColor: themeVars.dynamicColors.panel.background,
    color: themeVars.dynamicColors.panel.textColor,
    borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
    paddingLeft: themeVars.spacing['4'],
    paddingRight: themeVars.spacing['4'],

    '@media': {
      'screen and (max-width: 768px)': {
        height: `calc(${toolbarVars.toolbarHeight} + env(safe-area-inset-top, 0))`,
        paddingTop: `env(safe-area-inset-top, 0)`,
      },
    },
  },
]);

export const title = style({});

export const actionBox = style({
  display: 'flex',
  flexWrap: 'nowrap',
  flexDirection: 'row',
  alignItems: 'center',
  columnGap: themeVars.spacing['3'],
});

export const toolbarSnippetBox = style({
  position: 'absolute',
  top: 0,
  right: 0,
  left: 0,
  height: toolbarVars.toolbarHeight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
});

export const toolbarSnippet = style({
  pointerEvents: 'auto',
});

export const toolbarSnippetName = style({
  transition: `background-color 225ms ease-in-out`,
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['3']}`,
  borderRadius: themeVars.borderRadius.lg,
  ':hover': {
    backgroundColor: themeVars.dynamicColors.input.accentColor,
  },
});

export const mobileToolbarSnippet = style({
  vars: {
    [toolbarVars.toolbarHeight]: '32px',
  },
  height: toolbarVars.toolbarHeight,
  width: '100%',
  position: 'relative',
  background: backgroundColorVar,
  color: colorVar,
  display: 'flex',
  alignItems: 'center',
});
