import {createThemeContract} from '@vanilla-extract/css';

export const colors = createThemeContract({
  primary: null,
  secondary: null,
  background: null,
  baseText: null,
  descriptionTextColor: null,
  divider: null,

  panel: {
    background: null,
    textColor: null,
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
    primary: {
      backgroundColor: null,
      activeColor: null,
      hoverColor: null,
      textColor: null,
    },
  },

  menuBackground: null,
  resizeLineBackgroundColor: null,
  resizeLineBadgeBackgroundColor: null,
  listBoxPanelBackground: null,
  listBoxActiveBackgroundColor: null,
  listBoxHoverBackgroundColor: null,
  listBoxTextColor: null,
  listBoxActiveTextColor: null,
  scrollBarBackgroundColor: null,
  scrollBarHoverBackgroundColor: null,
  bottomBarBackgroundColor: null,
  bottomBarTextColor: null,
  emptySquareBackgroundColor: null,
  snackbarBackgroundColor: null,
  snackbarTextColor: null,
  frameDragControlBackgroundColor: null,
  dialogOverlayBackgroundColor: null,
  dialogTitleTextColor: null,
  dialogTitleBorderColor: null,
  dialogPanelShadow: null,
  dialogPanelTextColor: null,
  dialogPanelBackgroundColor: null,
  shortcutKeyBackgroundColor: null,
} as const);
