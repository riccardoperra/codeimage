import {themeVars} from '@codeimage/ui';
import {createTheme, createVar, fallbackVar, style} from '@vanilla-extract/css';

export const [terminalTheme, terminalVars] = createTheme({
  headerHeight: '50px',
  headerHeightLite: '36px',
  radius: '15px',
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

const glassBorderDark = `0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,.90), inset 0 0 0 1.5px rgba(255, 255, 255, 0.4)`;
const glassBorderLight = `0 0 15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 0 1px rgb(0,0,0,.05), inset 0 0 0 1px rgba(255, 255, 255, 0.15)`;

const glassBorderVar = createVar();

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
      '&[data-lite=true]': {
        vars: {
          [terminalVars.headerHeight]: terminalVars.headerHeightLite,
        },
      },
      '&[data-theme-mode=light]': {
        vars: {
          [terminalVars.headerColor]: `255, 255, 255`,
          [glassBorderVar]: glassBorderLight,
        },
      },
      '&[data-theme-mode=dark]': {
        vars: {
          [glassBorderVar]: glassBorderDark,
          [terminalVars.headerColor]: `0, 0, 0`,
        },
      },
      '&[data-custom-border=glass]': {
        boxShadow: `${glassBorderVar}, ${terminalVars.boxShadow}`,
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

  selectors: {
    [`[data-lite=true] &`]: {
      paddingBottom: themeVars.spacing['2'],
      paddingTop: themeVars.spacing['3'],
      paddingInlineStart: themeVars.spacing['2'],
      paddingInlineEnd: themeVars.spacing['2'],
    },
    [`[data-accent-header=false][data-header-visible=true][data-lite=true] &`]:
      {
        paddingTop: 0,
      },
  },
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
