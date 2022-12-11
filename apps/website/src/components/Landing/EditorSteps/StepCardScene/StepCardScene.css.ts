import {globalStyle, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

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

export const grid = style(
  responsiveStyle({
    mobile: {
      display: 'grid',
      gridTemplateRows: '1fr',
      flexDirection: 'row',
      gap: '24px',
    },
    tablet: {
      gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
      gridTemplateRows: '1fr',
    },
  }),
);

globalStyle(
  `${grid} > *`,
  responsiveStyle({
    mobile: {
      gridRowStart: 1,
      gridColumnStart: 1,
    },
    tablet: {
      gridColumnStart: 'unset',
    },
  }),
);
