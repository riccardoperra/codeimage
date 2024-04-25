import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const badge = style({
  fontSize: '10px',
  color: themeVars.brandLink,
  backgroundColor: themeVars.brandSoft,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${themeTokens.spacing['1']} ${themeTokens.spacing['2']}`,
  position: 'absolute',
  left: '100%',
  top: '50%',
  transform: `translateX(2px) translateY(-50%)`,
  borderRadius: themeTokens.radii.lg,
  whiteSpace: 'nowrap',
});
