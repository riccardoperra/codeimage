import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const editor = style({
  display: 'grid',
  gap: themeVars.spacing['2'],
});

export const input = style({
  color: themeVars.dynamicColors.baseText,
  background: themeVars.dynamicColors.input.backgroundColor,
  borderRadius: '8px',
  fontSize: themeVars.fontSize.sm,
  minHeight: '168px',
  maxHeight: 'min(300px, 40dvh)',
  overflow: 'hidden',
  selectors: {
    '&:focus-within': {
      outline: `2px solid ${themeVars.dynamicColors.primary}`,
      outlineOffset: '2px',
    },
  },
  '@media': {'screen and (max-width: 768px)': {fontSize: '16px'}},
});

export const key = style({
  color: '#7650a3',
  selectors: withThemeMode({dark: {color: '#d2aaff'}}),
});

export const string = style({
  color: '#28643c',
  selectors: withThemeMode({dark: {color: '#a6e3a1'}}),
});

export const literal = style({
  color: '#9a4314',
  selectors: withThemeMode({dark: {color: '#f9b783'}}),
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: themeVars.spacing['2'],
});

export const status = style({
  margin: 0,
  fontSize: themeVars.fontSize.sm,
});
