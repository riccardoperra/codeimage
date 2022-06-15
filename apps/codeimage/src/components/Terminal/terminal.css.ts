import {themeVars} from '@codeimage/ui';
import {createTheme, fallbackVar, style} from '@vanilla-extract/css';

export const [terminalTheme, terminalVars] = createTheme({
  headerHeight: '50px',
  radius: '12px',
  headerBackgroundColor: 'unset',
  backgroundColor: themeVars.backgroundColor.white,
  textColor: themeVars.backgroundColor.gray['800'],
  boxShadow: themeVars.boxShadow.lg,
  tabDelta: '10px',
  headerColor: '0, 0, 0',
  headerBackground: 'rgba(0, 0, 0, 0)',
  tabAccentActiveBackground: 'unset',
  tabAccentInactiveBackground: 'unset',
  tabTextColor: 'unset',
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    color: terminalVars.textColor,
    overflow: 'hidden',
    borderRadius: terminalVars.radius,
    boxShadow: terminalVars.boxShadow,
    transition: 'box-shadow .2s, border-radius .2s',
    selectors: {
      '&[data-theme-mode=light]': {
        vars: {
          [terminalVars.headerColor]: `255, 255, 255`,
        },
      },
      '&[data-theme-mode=dark] &': {
        vars: {
          [terminalVars.headerColor]: `0, 0, 0`,
        },
      },
    },
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
      backgroundColor: fallbackVar(
        terminalVars.headerBackgroundColor,
        `rgba(0, 0, 0, .06)`,
      ),
    },
    '[data-theme-mode=dark] &[data-accent-visible=true]': {
      backgroundColor: fallbackVar(
        terminalVars.headerBackgroundColor,
        `rgba(255, 255, 255, .06)`,
      ),
    },
  },
});

export const watermark = style({
  position: 'absolute',
  right: '6px',
  bottom: '-6px',
  opacity: 0.35,
  backgroundColor: 'inherit',
});
