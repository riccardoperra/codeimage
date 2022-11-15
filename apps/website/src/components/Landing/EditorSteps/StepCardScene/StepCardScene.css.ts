import {style} from '@vanilla-extract/css';

export const container = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  position: 'relative',
  overflow: 'hidden',
  order: -1,
});

export const flexibleContent = style({
  display: 'flex',
  flexDirection: 'column',
  top: 0,
});

export const innerContent = style({
  height: `100%`,
  display: 'flex',
  width: '100%',
});

export const grid = style({
  display: 'grid',
  gridTemplateRows: '1fr 1fr 1fr',
  flexDirection: 'row',
  gap: '24px',
  '@media': {
    '(min-width: 748px)': {
      gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
      gridTemplateRows: '1fr',
    },
  },
});
