import {style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const wrapper = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
});

export const box = style({
  height: '60px',
  flex: 1,
  backgroundColor: themeVars.backgroundColor.white,
  borderRadius: themeVars.borderRadius.lg,
});
