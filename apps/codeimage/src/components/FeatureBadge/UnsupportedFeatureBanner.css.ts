import {backgroundColorVar} from '@codeimage/ui';
import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const unsupportedBanner = style({
  backgroundColor: themeVars.brandSecondary,
  color: '#fff',
});

export const supportedTableGrid = style({
  display: 'flex',
  gap: themeTokens.spacing['4'],
  flexWrap: 'wrap',
});

export const supportedTableGridItem = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: themeTokens.spacing['2'],
  padding: themeTokens.spacing['3'],
  borderRadius: themeTokens.radii.md,
  fontSize: themeTokens.fontSize.xs,
  backgroundColor: backgroundColorVar,
  selectors: {
    '&[data-supported]': {
      vars: {
        [backgroundColorVar]: '#37991e',
      },
      color: 'white',
    },
    '&[data-unsupported]': {
      vars: {
        [backgroundColorVar]: '#5d0606',
      },
      color: 'white',
    },
    '&[data-current]': {
      outline: `1px solid ${themeVars.brand}`,
      outlineOffset: '3px',
    },
  },
});

export const supportedTableGridContainer = style({
  marginTop: themeTokens.spacing['4'],
  marginBottom: themeTokens.spacing['4'],
});

export const bannerText = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeTokens.spacing['2'],
});

export const compatibilityTableLink = style({
  color: themeVars.brandLink,
  textDecoration: 'underline',
});
