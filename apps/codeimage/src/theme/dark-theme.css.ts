import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

const grayScale = {
  gray1: '#111111',
  gray2: '#1d1d1d',
  gray3: '#232323',
  gray4: '#282828',
  gray5: '#2B2B2B',
  gray6: '#333333',
  gray7: '#3e3e3e',
  gray8: '#505050',
  gray9: '#707070',
  gray10: '#7e7e7e',
  gray11: '#a0a0a0',
  gray12: '#ededed',
  white: '#ffffff',
} as const;

export const darkThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['400'],
  background: grayScale.gray2,
  baseText: themeVars.textColor.gray['800'],
  descriptionTextColor: '#999999',
  secondary: themeVars.backgroundColor.gray['200'],
  divider: '#252525',

  panel: {
    background: grayScale.gray1,
    textColor: grayScale.white,
  },

  input: {
    backgroundColor: grayScale.gray3,
    borderColor: 'transparent',
    textColor: grayScale.gray12,
    labelTextColor: grayScale.gray12,
    labelTextHintColor: grayScale.gray11,
    accentColor: grayScale.gray8,
  },

  button: {
    base: {
      backgroundColor: grayScale.gray6,
      activeColor: grayScale.gray8,
      hoverColor: grayScale.gray7,
      textColor: grayScale.gray12,
    },
    primary: {
      backgroundColor: themeVars.backgroundColor.blue['500'],
      activeColor: themeVars.backgroundColor.blue['700'],
      hoverColor: themeVars.backgroundColor.blue['600'],
      textColor: themeVars.backgroundColor.white,
    },
  },

  listBox: {
    panelBackground: grayScale.gray4, // 5
    activeBackgroundColor: themeVars.backgroundColor.blue['700'], // 500
    hoverBackgroundColor: grayScale.gray6,
    textColor: grayScale.gray12,
    activeTextColor: grayScale.gray12,
  },

  dialog: {
    overlayBackgroundColor: 'rgba(0,0,0,.7)',
    panelBackgroundColor: grayScale.gray2, // 2,
    panelShadow: `0 10px 30px 0 rgba(0,0,0,.15), inset 0 0 0 1px ${grayScale.gray3}`,
    panelTextColor: grayScale.gray12,
    titleTextColor: grayScale.gray12,
    titleBorderColor: grayScale.gray5,
  },

  scrollBar: {
    backgroundColor: grayScale.gray8,
    hoverBackgroundColor: grayScale.gray6,
  },

  snackbar: {
    backgroundColor: grayScale.gray11,
    textColor: grayScale.gray6,
  },

  bottomBar: {
    backgroundColor: grayScale.gray5,
    textColor: grayScale.gray11,
  },

  resizeLineBackgroundColor: 'hsla(0,0%,100%,.25)',
  resizeLineBadgeBackgroundColor: '#161515',
  emptySquareBackgroundColor: '#252525',
  frameDragControlBackgroundColor: `#EEEEEE`,
  shortcutKeyBackgroundColor: '#555555',
});
