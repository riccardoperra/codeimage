import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const main = style({
  backgroundColor: '#000',
  paddingTop: themeVars.spacing[24],
  paddingBottom: themeVars.spacing[24],
});

export const editorImage = style({
  padding: themeVars.spacing[12],
});

export const editorImageCard = style({
  borderRadius: '1.5rem',
  flex: 1,
  background:
    'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  overflow: 'hidden',
  height: '500px',
});
