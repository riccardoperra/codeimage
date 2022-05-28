import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const tabHint = style({
  position: 'absolute',
  backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
  boxShadow: themeVars.dynamicColors.dialog.panelShadow,
  borderRadius: themeVars.borderRadius.lg,
  zIndex: themeVars.zIndex['50'],
  maxHeight: '250px',
  overflowY: 'auto',
  left: 0,
  transition: 'all 100ms ease-in-out',
});

export const tabHintDropdownOption = style({
  outline: 'none',
  ':focus': {
    outline: 'none',
  },
  ':focus-visible': {
    outline: 'none',
  },
});

export const tabHintDropdownItemContent = style({
  height: '32px',
  fontWeight: themeVars.fontWeight.normal,
  fontSize: themeVars.fontSize.sm,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${themeVars.spacing['3']}`,
  borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
  color: themeVars.dynamicColors.listBox.textColor,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  vars: {
    ['--highlight-color']: 'rgb(112, 182, 246, 0.25)',
  },
  ':hover': {
    backgroundColor: themeVars.dynamicColors.listBox.hoverBackgroundColor,
    color: themeVars.dynamicColors.listBox.textColor,
  },
  selectors: {
    ['[active] &']: {
      backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
      color: themeVars.dynamicColors.listBox.activeTextColor,
    },
    ['[aria-selected=true] &']: {
      backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
      color: themeVars.dynamicColors.listBox.activeTextColor,
    },
  },
});

export const tabText = style([
  {
    display: 'inline-block',
  },
]);
