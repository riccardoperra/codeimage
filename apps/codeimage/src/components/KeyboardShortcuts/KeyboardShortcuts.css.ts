import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {fontSize} from '../ui/Text/Text.css';

export const list = style({
  display: 'grid',
  gridGap: '0 60px',
  gridTemplateColumns: 'auto 1fr',
  gridAutoRows: '40px',
  margin: 0,
  alignItems: 'center',
  color: 'white',
  padding: `${themeVars.spacing['6']} ${themeVars.spacing['6']}`,
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: themeVars.dynamicColors.dialogOverlayBackgroundColor,
});

export const keyLabel = style([
  fontSize.sm,
  {
    color: themeVars.dynamicColors.buttonTextColor,
  },
]);

export const keyList = style({
  display: 'flex',
  columnGap: themeVars.spacing['1'],
  justifyContent: 'flex-end',
});

export const key = style([
  fontSize.sm,
  {
    minWidth: '24px',
    height: '24px',
    padding: '4px 8px',
    borderRadius: themeVars.borderRadius.md,
    backgroundColor: themeVars.dynamicColors.shortcutKeyBackgroundColor,
    color: themeVars.dynamicColors.buttonTextColor,
    fontFamily: 'inherit',
  },
]);
