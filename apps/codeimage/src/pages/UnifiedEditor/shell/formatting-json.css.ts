import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const editor = style({
  display: 'grid',
  gap: themeVars.spacing['2'],
});

export const input = style({
  fontFamily: 'monospace',
  minHeight: '168px',
  resize: 'vertical',
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
