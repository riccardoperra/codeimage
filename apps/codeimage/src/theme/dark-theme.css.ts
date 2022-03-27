import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

const palette = {
  systemDarkGray1: '#333333',
  systemDarkGray2: '#2B2B2B',
  systemDarkGray3: '#282828',
  systemDarkGray4: '#252525',
  systemDarkGray5: '#232323',
  systemDarkGray6: '#1d1d1d',
  systemDarkGray7: '#181818',
  systemDarkGray8: '#161515',
  systemDarkGray9: '#111111',
  white: '#FFFFFF',
} as const;

// const grayDark = {
//   gray1: 'hsl(0, 0%, 8.5%)',
//   gray2: 'hsl(0, 0%, 11.0%)',
//   gray3: 'hsl(0, 0%, 13.6%)',
//   gray4: 'hsl(0, 0%, 15.8%)',
//   gray5: 'hsl(0, 0%, 17.9%)',
//   gray6: 'hsl(0, 0%, 20.5%)',
//   gray7: 'hsl(0, 0%, 24.3%)',
//   gray8: 'hsl(0, 0%, 31.2%)',
//   gray9: 'hsl(0, 0%, 43.9%)',
//   gray10: 'hsl(0, 0%, 49.4%)',
//   gray11: 'hsl(0, 0%, 62.8%)',
//   gray12: 'hsl(0, 0%, 93.0%)',
// };

const grayDark = {
  gray1: '#111111',
  gray2: '#1d1d1d',
  gray3: '#232323',
  gray4: '#282828',
  gray5: '#252525',
  gray6: '#333333',
  gray7: '#3e3e3e',
  gray8: '#505050',
  gray9: '#707070',
  gray10: '#7e7e7e',
  gray11: '#a0a0a0',
  gray12: '#ededed',
};

export const darkThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['400'],
  background: grayDark.gray2,
  baseText: themeVars.textColor.gray['800'],
  descriptionTextColor: '#999999',
  secondary: themeVars.backgroundColor.gray['200'],
  divider: '#252525',

  panel: {
    background: grayDark.gray1,
    textColor: palette.white,
  },

  input: {
    backgroundColor: grayDark.gray3,
    borderColor: 'transparent',
    textColor: grayDark.gray12,
    labelTextColor: grayDark.gray12,
    labelTextHintColor: grayDark.gray11,
    accentColor: grayDark.gray8,
  },

  button: {
    base: {
      backgroundColor: grayDark.gray6,
      activeColor: grayDark.gray8,
      hoverColor: grayDark.gray7,
      textColor: grayDark.gray12,
    },
    primary: {
      backgroundColor: themeVars.backgroundColor.blue['500'],
      activeColor: themeVars.backgroundColor.blue['700'],
      hoverColor: themeVars.backgroundColor.blue['600'],
      textColor: themeVars.backgroundColor.white,
    },
  },

  listBox: {
    panelBackground: grayDark.gray3, // 5
    activeBackgroundColor: themeVars.backgroundColor.blue['700'], // 500
    hoverBackgroundColor: grayDark.gray6,
    textColor: grayDark.gray12,
    activeTextColor: grayDark.gray12,
  },

  menuBackground: '#2b2b2b',
  resizeLineBackgroundColor: 'hsla(0,0%,100%,.25)',
  resizeLineBadgeBackgroundColor: '#161515',
  scrollBarBackgroundColor: '#555555',
  scrollBarHoverBackgroundColor: '#333333',
  bottomBarBackgroundColor: '#2B2B2B',
  bottomBarTextColor: '#EEEEEE',
  emptySquareBackgroundColor: '#252525',
  snackbarBackgroundColor: '#EEEEEE',
  snackbarTextColor: themeVars.textColor.gray['800'],
  frameDragControlBackgroundColor: `#EEEEEE`,
  dialogOverlayBackgroundColor: 'rgba(0,0,0,.7)',
  dialogPanelBackgroundColor: '#1d1d1d',
  dialogPanelShadow:
    '0px 10px 30px 0px rgba(0,0,0,.15),inset 0 0 0 1px #222222',
  dialogTitleTextColor: '#EEEEEE',
  dialogTitleBorderColor: '#2B2B2B',
  dialogPanelTextColor: '#EEEEEE',
  shortcutKeyBackgroundColor: '#555555',
});
