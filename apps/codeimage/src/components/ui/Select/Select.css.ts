import {style} from '@vanilla-extract/css';
import * as textFieldStyles from '../TextField/TextField.css';
import * as textStyles from '../Text/Text.css';
import {themeVars} from '../../../theme/global.css';
import {recipe} from '@vanilla-extract/recipes';

export const wrapper = style({
  width: '100%',
  position: 'relative',
  display: 'flex',
  alignItems: 'stretch',
  flexDirection: 'column',
});

export const listBox = style([
  textFieldStyles.baseField,
  textStyles.fontSize.xs,
  {
    width: '100%',
    height: '100%',
    textAlign: 'left',
    paddingLeft: themeVars.spacing['2'],
  },
]);

export const listBoxPanel = style([
  textStyles.fontSize.xs,
  {
    position: 'absolute',
    width: '100%',
    maxHeight: '250px',
    paddingTop: themeVars.spacing['1'],
    overflow: 'auto',
    backgroundColor: themeVars.dynamicColors.listBoxPanelBackground,
    borderRadius: themeVars.borderRadius.lg,
    boxShadow: themeVars.boxShadow.lg,

    '::-webkit-scrollbar': {
      width: '20px',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: themeVars.backgroundColor.gray['400'],
      borderRadius: themeVars.borderRadius.full,
      border: '6px solid transparent',
      backgroundClip: 'content-box',
      transition: 'background-color .2s',
    },

    ':focus': {
      outline: 'none',
    },
  },
]);

export const listBoxOptionWrapper = style({
  ':focus': {
    outline: 'none',
  },
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['2']}`,
});

export const listBoxOption = recipe({
  base: {
    cursor: 'default',
    userSelect: 'none',
    position: 'relative',
    padding: `${themeVars.spacing['2']}`,
    borderRadius: themeVars.borderRadius.lg,
    color: themeVars.dynamicColors.listBoxTextColor,
    ':hover': {
      backgroundColor: themeVars.dynamicColors.listBoxHoverBackgroundColor,
    },
  },
  variants: {
    active: {
      true: {
        backgroundColor: themeVars.dynamicColors.listBoxActiveBackgroundColor,
        color: themeVars.dynamicColors.listBoxActiveTextColor,
        ':hover': {
          backgroundColor: themeVars.dynamicColors.listBoxActiveBackgroundColor,
        },
      },
    },
  },
});

export const selected = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
});

export const selectorIconWrapper = style({
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
  top: '50%',
  paddingRight: themeVars.spacing['1'],
  transform: 'translateY(-50%)',
});

export const selectorIcon = style({
  color: themeVars.dynamicColors.inputTextColor,
  width: themeVars.width['4'],
  height: themeVars.width['4'],
});
