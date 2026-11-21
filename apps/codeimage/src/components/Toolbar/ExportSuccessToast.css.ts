import {tokens} from '@codeui/kit/tokens';
import {style} from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '1rem',
  rowGap: '0.25rem',
});

export const action = style({
  marginInline: `calc(-1 * ${tokens.space['2']})`,
});
