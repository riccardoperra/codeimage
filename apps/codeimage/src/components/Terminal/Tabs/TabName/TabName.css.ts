import {themeVars} from '@codeimage/ui';
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

export const tabHint = style({
  position: 'fixed',
  visibility: 'hidden',
  minWidth: '72px',
  maxHeight: '250px',
  overflowY: 'auto',
  backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
  boxShadow: themeVars.dynamicColors.dialog.panelShadow,
  borderRadius: themeVars.borderRadius.lg,
  zIndex: themeVars.zIndex['50'],
  '@media': {
    '(prefers-reduced-motion: no-preference)': {
      animation: `${contentShow} 150ms ease-out`,
    },
  },
});

export const tabHintDropdownItemContent = style({
  height: '34px',
  fontWeight: themeVars.fontWeight.normal,
  fontSize: themeVars.fontSize.sm,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${themeVars.spacing['3']}`,
  borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
  color: themeVars.dynamicColors.listBox.textColor,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVars.dynamicColors.listBox.hoverBackgroundColor,
  },
  selectors: {
    '&[aria-selected="true"]': {
      backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
      color: themeVars.dynamicColors.listBox.activeTextColor,
    },
  },
});

export const tabText = style({display: 'inline-block'});
export const highlightedText = style({
  backgroundColor: 'rgb(112, 182, 246, 0.25)',
});

export const control = style({});

export const inlineHiddenItem = style({
  visibility: 'hidden',
  display: 'inline-block',
  height: 0,
  left: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
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
