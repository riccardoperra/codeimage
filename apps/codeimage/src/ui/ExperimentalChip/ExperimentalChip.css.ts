import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const chip = style({
  fontSize: '14px',
  color: themeVars.brandLink,
  backgroundColor: themeVars.brandSoftAccentActive,
  border: `1px solid ${themeVars.brandSoft}`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${themeTokens.spacing['2']} ${themeTokens.spacing['3']}`,
  borderRadius: themeTokens.radii.lg,
  whiteSpace: 'nowrap',
  gap: themeTokens.spacing['2'],
  marginLeft: themeTokens.spacing['3'],
});
