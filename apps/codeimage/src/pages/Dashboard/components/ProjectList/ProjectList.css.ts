import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const gridList = style({
  display: 'grid',
  gap: themeVars.spacing['3'],
  width: '100%',
  marginBottom: themeVars.spacing['12'],
  gridTemplateColumns: 'repeat(2, minmax(0px, 1fr))',
});
