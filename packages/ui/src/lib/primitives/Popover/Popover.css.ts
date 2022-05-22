import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';
import {fontSize, fontWeight} from '../Text/Text.css';

export const container = style({
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.lg,
  backgroundColor: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.panel.textColor,
  display: 'flex',
  flexDirection: 'column',
  width: '260px',
  boxShadow: themeVars.boxShadow.md,
  maxWidth: '300px',
});

export const title = style([
  fontSize.sm,
  fontWeight.semibold,
  {
    padding: themeVars.spacing['4'],
    marginTop: 0,
    paddingBottom: 0,
  },
]);

export const content = style({
  padding: themeVars.spacing['4'],
});
