import {fallbackVar, style} from '@vanilla-extract/css';
import * as textFieldStyles from '../TextField/TextField.css';
import * as textStyles from '../Text/Text.css';
import * as boxStyles from '../Box/Box.css';
import {recipe} from '@vanilla-extract/recipes';
import {fontSize, themeVars} from '../../theme';

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
    textAlign: 'left',
    paddingLeft: themeVars.spacing['2'],
  },
]);

export const listBoxPanel = style([
  textStyles.fontSize.xs,
  boxStyles.boxBase,
  {
    position: 'absolute',
    width: '100%',
    maxHeight: '250px',
    paddingTop: themeVars.spacing['1'],
    overflow: 'auto',
    backgroundColor: themeVars.dynamicColors.listBox.panelBackground,
    borderRadius: themeVars.borderRadius.lg,
    boxShadow: themeVars.boxShadow.lg,
    zIndex: 100,

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
    color: themeVars.dynamicColors.listBox.textColor,
    ':hover': {
      backgroundColor: themeVars.dynamicColors.listBox.hoverBackgroundColor,
    },
  },
  variants: {
    active: {
      true: {
        backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
        color: themeVars.dynamicColors.listBox.activeTextColor,
        ':hover': {
          backgroundColor:
            themeVars.dynamicColors.listBox.activeBackgroundColor,
        },
      },
    },
  },
});

export const selected = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
  fontWeight: themeVars.fontWeight.medium,
  fontSize: fallbackVar(fontSize, themeVars.fontSize.sm),
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
  color: themeVars.dynamicColors.input.textColor,
  width: themeVars.width['4'],
  height: themeVars.width['4'],
});

export const native = style([
  textFieldStyles.baseField,
  textStyles.fontSize.xs,
  {
    opacity: 0,
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    display: 'inline-flex',
    appearance: 'none',
    border: 0,
    paddingLeft: themeVars.spacing['2'],
    outline: 'none',

    ':focus': {
      border: 0,
      outline: 'none',
    },

    ':focus-visible': {
      border: 0,
      outline: 'none',
    },
  },
]);
