import {themeTokens, themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const h6 = style({
  fontSize: themeTokens.fontSize.lg,
  fontWeight: themeTokens.fontWeight.medium,
});

export const h5 = style({
  fontSize: themeTokens.fontSize.lg,
  fontWeight: themeTokens.fontWeight.medium,
});

export const h4 = style({
  fontSize: themeTokens.fontSize.lg,
  fontWeight: themeTokens.fontWeight.medium,
});

export const h3 = style({
  fontSize: '1.5rem',
  fontWeight: themeTokens.fontWeight.semibold,
});

export const h2 = style({
  fontSize: '1.875rem',
  fontWeight: themeTokens.fontWeight.semibold,
  marginTop: themeTokens.spacing['3'],
  marginBottom: themeTokens.spacing['3'],
});

export const h1 = style({
  fontSize: '2.25rem',
  color: themeVars.foreground,
  fontWeight: themeTokens.fontWeight.bold,
  marginBottom: themeTokens.spacing['6'],
});

export const p = style({
  fontSize: themeTokens.fontSize.md,
  marginTop: themeTokens.spacing['3'],
  marginBottom: themeTokens.spacing['3'],
  lineHeight: '1.75rem',
  wordBreak: 'break-word',
});

export const code = style({
  padding: '.2em .4em',
  margin: '0',
  fontSize: '85%',
  whiteSpace: 'break-spaces',
  backgroundColor: themeVars.brandSecondary,
  borderRadius: '6px',
});

export const img = style({
  width: '100%',
});

export const ul = style({
  listStyleType: 'disc',
  paddingLeft: themeTokens.spacing['8'],
  marginBottom: themeTokens.spacing['2'],
});

export const li = style({
  marginBottom: themeTokens.spacing['2'],
  wordBreak: 'break-word',
});

export const video = style({
  width: '100%',
  height: 'auto',
  borderRadius: themeTokens.radii.lg,
  overflow: 'hidden',
  display: 'block',
  marginTop: themeTokens.spacing['3'],
  marginBottom: themeTokens.spacing['6'],
  backgroundColor: themeVars.formAccent,
});

export const a = style({
  color: themeVars.brandLink,
});
