import {createThemeContract} from '@vanilla-extract/css';

export const themeColors = createThemeContract({
  primary: null,
  secondary: null,
  background: null,
  baseText: null,
  descriptionTextColor: null,
  divider: null,

  panel: {
    background: null,
    textColor: null,
    textColorAlt: null,
  },

  input: {
    backgroundColor: null,
    borderColor: null,
    textColor: null,
    accentColor: null,
    labelTextColor: null,
    labelTextHintColor: null,
  },

  button: {
    base: {
      backgroundColor: null,
      activeColor: null,
      hoverColor: null,
      textColor: null,
    },
    primaryAlt: {
      backgroundColor: null,
      hoverColor: null,
      textColor: null,
    },
    primary: {
      backgroundColor: null,
      activeColor: null,
      hoverColor: null,
      textColor: null,
    },
    danger: {
      backgroundColor: null,
      activeColor: null,
      hoverColor: null,
      textColor: null,
    },
  },

  listBox: {
    panelBackground: null,
    activeBackgroundColor: null,
    hoverBackgroundColor: null,
    textColor: null,
    activeTextColor: null,
  },

  dialog: {
    overlayBackgroundColor: null,
    titleTextColor: null,
    titleBorderColor: null,
    panelShadow: null,
    panelTextColor: null,
    panelBackgroundColor: null,
  },

  scrollBar: {
    backgroundColor: null,
    hoverBackgroundColor: null,
  },

  snackbar: {
    backgroundColor: null,
    textColor: null,
  },

  bottomBar: {
    backgroundColor: null,
    textColor: null,
  },
} as const);
