import {createVar, style} from '@vanilla-extract/css';

export const activeColorVar = createVar();

export const container = style({
  margin: '4px',
  display: 'flex',
  alignItems: 'center',
  border: `1px solid rgb(24 24 27)`,
  backgroundColor: 'rgb(39 39 42 / 0.15)',
  placeContent: 'center flex-start',
  flexFlow: 'row nowrap',
  gap: '96px',
  overflow: 'visible',
  flex: 1,
  position: 'relative',
  flexDirection: 'column',
  padding: '24px',
  borderRadius: '24px',
  opacity: 1,
  mixBlendMode: 'hue',
  transition: 'box-shadow .2s cubic-bezier(.4,0,.2,1)',
  userSelect: 'none',
  selectors: {
    '&[data-active=true]': {
      boxShadow: `rgb(255,255,255) 0px 0px 0px 0px, ${activeColorVar} 0px 0px 0px 3px, rgba(0,0,0,0) 0px 0px 0px 0px`,
    },
  },
});
