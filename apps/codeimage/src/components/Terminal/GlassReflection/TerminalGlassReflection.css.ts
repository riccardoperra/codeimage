import {style} from '@vanilla-extract/css';

export const wrapper = style({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
});

export const content = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  transform: `skewX(-18deg) translateX(-55%)`,
  zIndex: '100',

  selectors: {
    '[data-theme-mode=light] &': {
      background:
        'linear-gradient(rgba(100,100,100, .035) 35%, rgba(0,0,0,0%) 100%)',
    },
    '[data-theme-mode=dark] &': {
      background:
        'linear-gradient(rgba(255,255,255, .035) 35%, rgba(255,255,255,0%) 100%)',
    },
  },
});
