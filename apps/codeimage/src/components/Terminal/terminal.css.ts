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

export const terminalShadows = {
  small: 'rgba(0, 0, 0, 0.08) 0px 4px 12px;',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: 'rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px',
  xl: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
  '3d': 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
  multicolor:
    'rgb(85, 91, 255) 0px 0px 0px 3px, rgb(31, 193, 27) 0px 0px 0px 6px, rgb(255, 217, 19) 0px 0px 0px 9px, rgb(255, 156, 85) 0px 0px 0px 12px, rgb(255, 85, 85) 0px 0px 0px 15px',
  outline: 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px',
};

export const shadowsLabel = Object.entries(terminalShadows).map(
  ([key, value]) => ({
    label: key,
    value,
  }),
);

// better this solution?

// export const shadowsLabel = [
//   {
//     label: 'small',
//     value: 'rgba(0, 0, 0, 0.08) 0px 4px 12px;',
//   },
//   {
//     label: 'md',
//     value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//   },
//   {
//     label: 'lg',
//     value: 'rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px',
//   },
//   {
//     label: 'xl',
//     value: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
//   },
//   {
//     label: '3d',
//     value: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
//   },
//   {
//     label: 'multicolor',
//     value: 'rgb(85, 91, 255) 0px 0px 0px 3px, rgb(31, 193, 27) 0px 0px 0px 6px, rgb(255, 217, 19) 0px 0px 0px 9px, rgb(255, 156, 85) 0px 0px 0px 12px, rgb(255, 85, 85) 0px 0px 0px 15px',
//   },
//   {
//     label: 'outline',
//     value: 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px',
//   }
// ];
