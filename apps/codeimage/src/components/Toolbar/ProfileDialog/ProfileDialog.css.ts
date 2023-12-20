import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const profileBox = style({
  backgroundColor: themeVars.formAccent,
  padding: themeTokens.spacing['4'],
  borderRadius: themeTokens.radii.md,
  gap: themeTokens.spacing['4'],
  display: 'flex',
  alignItems: 'center',
});

export const passkeysBox = style({
  marginTop: themeTokens.spacing['4'],
  backgroundColor: themeVars.formAccent,
  padding: themeTokens.spacing['4'],
  borderRadius: themeTokens.radii.md,
});

export const passkeysBoxTitle = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: themeTokens.spacing['4'],
});

export const passkeysList = style({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: themeTokens.radii.sm,
  background: themeVars.formAccentBorder,
});

export const passkeyItem = style({
  height: '42px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: themeTokens.spacing['3'],
  paddingRight: themeTokens.spacing['3'],
  justifyContent: 'space-between',

  selectors: {
    '&:not(:last-child)': {
      borderBottom: `1px solid ${themeVars.separator}`,
    },
  },
});
