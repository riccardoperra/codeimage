import {style} from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid rgb(24 24 27)`,
  backgroundColor: 'rgb(39 39 42 / 0.25)',
  placeContent: 'center flex-start',
  flexFlow: 'row nowrap',
  gap: '96px',
  overflow: 'visible',
  flex: 1,
  position: 'relative',
  flexDirection: 'column',
  padding: '24px',
  borderRadius: '24px',
});
