import {themeVars} from '@codeimage/ui';
import {componentStateStyles} from '@kobalte/vanilla-extract';
import {keyframes, style} from '@vanilla-extract/css';

const contentShow = keyframes({
  from: {
    opacity: 0,
    transform: 'translateY(-8px)',
  },
  to: {
    opacity: 1,
    transform: 'translateY(0)',
  },
});

const contentHide = keyframes({
  from: {
    opacity: 1,
    transform: 'translateY(0px)',
  },
  to: {
    opacity: 0,
    transform: 'translateY(-0)',
  },
});

export const tabHint = style([
  {
    position: 'absolute',
    backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
    boxShadow: themeVars.dynamicColors.dialog.panelShadow,
    borderRadius: themeVars.borderRadius.lg,
    zIndex: themeVars.zIndex['50'],
    maxHeight: '250px',
    overflowY: 'auto',
    left: 0,
    transition: 'all 200ms ease-in-out',
    transformOrigin: 'var(--kb-combobox-content-transform-origin)',
    animation: `${contentHide} 150ms ease-in forwards`,
  },
  componentStateStyles({
    expanded: {
      animation: `${contentShow} 150ms ease-out`,
    },
  }),
]);

export const listbox = style({
  maxHeight: '250px',
  overflowY: 'auto',
});

export const tabHintDropdownItemContent = style([
  {
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
  },
  componentStateStyles({
    highlighted: {
      backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
      color: themeVars.dynamicColors.listBox.activeTextColor,
    },
  }),
]);

export const tabText = style([
  {
    display: 'inline-block',
  },
]);

export const control = style({});

export const inlineHiddenItem = style({
  visibility: 'hidden',
  display: 'inline-block',
  height: 0,
  position: 'absolute',
});

export const input = style({
  backgroundColor: 'transparent',
  color: 'inherit',
  appearance: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  border: 'none',
});
