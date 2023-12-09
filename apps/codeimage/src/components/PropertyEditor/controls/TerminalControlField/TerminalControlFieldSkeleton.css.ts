import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style({
  height: '50px',
  display: 'flex',
  paddingLeft: themeVars.spacing['2'],
  paddingRight: themeVars.spacing['2'],
  borderRadius: themeVars.borderRadius.md,
  alignItems: 'center',
});
