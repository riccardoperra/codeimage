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

export const shadowsLabel = [
  {
    label: 'none',
    value: 'none',
  },
  {
    label: 'bottom',
    value: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
  },
  {
    label: 'small',
    value:
      'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
  },
  {
    label: 'medium',
    value: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
  },
  {
    label: 'large',
    value: themeVars.boxShadow.lg,
  },
  {
    label: 'extra large',
    value: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
  },
  {
    label: '3d',
    value:
      'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
  },
  {
    label: 'outlined',
    value: 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px',
  },
];
