import {backgroundColorVar} from '@codeimage/ui';
import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const themeCardList = style({
  display: 'flex',
  gap: themeTokens.spacing['4'],
  flexWrap: 'wrap',
});

export const themeCard = style({
  border: `1px solid ${themeVars.separator}`,
  boxShadow: themeTokens.boxShadow.md,
  padding: themeTokens.spacing['4'],
  borderRadius: themeTokens.radii.lg,
  background: themeVars.accent2,
});

export const themeBox = style({
  marginTop: themeTokens.spacing['4'],
  backgroundColor: backgroundColorVar,
  borderRadius: themeTokens.radii.lg,
  padding: themeTokens.spacing['4'],
});
