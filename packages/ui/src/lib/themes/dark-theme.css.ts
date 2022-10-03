import {themeVars} from '../theme/global2.css';
import {createGlobalCodeImageTheme} from '../tokens/createCodeImageTheme';

export const darkGrayScale = {
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

createGlobalCodeImageTheme('dark', {
  primary: themeVars.backgroundColor.blue['400'],
  background: darkGrayScale.gray2,
  baseText: darkGrayScale.gray12,
  descriptionTextColor: '#999999',
  secondary: themeVars.backgroundColor.gray['200'],
  divider: '#252525',

  panel: {
    background: darkGrayScale.gray1,
    textColor: darkGrayScale.white,
    textColorAlt: '#CCCCCC',
  },

  input: {
    backgroundColor: darkGrayScale.gray3,
    borderColor: 'transparent',
    textColor: darkGrayScale.gray12,
    labelTextColor: darkGrayScale.gray12,
    labelTextHintColor: darkGrayScale.gray11,
    accentColor: darkGrayScale.gray8,
  },

  button: {
    base: {
      backgroundColor: darkGrayScale.gray6,
      activeColor: darkGrayScale.gray8,
      hoverColor: darkGrayScale.gray7,
      textColor: darkGrayScale.gray12,
    },
    primaryAlt: {
      backgroundColor: `hsla(204, 100%, 50%, 0.15)`,
      hoverColor: `hsla(204, 100%, 40%, 0.15)`,
      textColor: themeVars.backgroundColor.blue['500'],
    },
    primary: {
      backgroundColor: themeVars.backgroundColor.blue['500'],
      activeColor: themeVars.backgroundColor.blue['700'],
      hoverColor: themeVars.backgroundColor.blue['600'],
      textColor: themeVars.backgroundColor.white,
    },
    danger: {
      backgroundColor: themeVars.backgroundColor.red['500'],
      activeColor: themeVars.backgroundColor.red['700'],
      hoverColor: themeVars.backgroundColor.red['600'],
      textColor: themeVars.backgroundColor.white,
    },
  },

  listBox: {
    panelBackground: darkGrayScale.gray4, // 5
    activeBackgroundColor: themeVars.backgroundColor.blue['700'], // 500
    hoverBackgroundColor: darkGrayScale.gray6,
    textColor: darkGrayScale.gray12,
    activeTextColor: darkGrayScale.gray12,
  },

  dialog: {
    overlayBackgroundColor: 'rgba(0,0,0,.7)',
    panelBackgroundColor: darkGrayScale.gray2, // 2,
    panelShadow: `0 10px 30px 0 rgba(0,0,0,.15), inset 0 0 0 1px ${darkGrayScale.gray3}`,
    panelTextColor: darkGrayScale.gray12,
    titleTextColor: darkGrayScale.gray12,
    titleBorderColor: darkGrayScale.gray5,
  },

  scrollBar: {
    backgroundColor: darkGrayScale.gray8,
    hoverBackgroundColor: darkGrayScale.gray6,
  },

  snackbar: {
    backgroundColor: darkGrayScale.gray5,
    textColor: themeVars.backgroundColor.white,
  },

  bottomBar: {
    backgroundColor: darkGrayScale.gray5,
    textColor: darkGrayScale.gray11,
  },
});
