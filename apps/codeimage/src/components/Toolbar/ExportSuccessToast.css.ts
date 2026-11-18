import * as buttonStyles from '@codeui/kit/button-styles';
import {style} from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '1rem',
  rowGap: '0.25rem',
});

export const action = style({
  marginInline: `calc(-1 * ${buttonStyles.buttonVars.padding})`,
});
