import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const badge = style({
  width: '36px',
  height: '36px',
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.borderRadius.lg,
  backgroundColor: themeVars.backgroundColor.indigo['500'],
  color: themeVars.backgroundColor.white,
});
