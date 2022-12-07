import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';

const animationCurve = createVar();

export const bgFullAnimation = style({
  vars: {
    [animationCurve]: 'cubic-bezier(0.06, 0.6, 0.36, 1.0)',
  },
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: '1px',
  height: '1px',
  opacity: 1,
  margin: '0',
  borderRadius: themeVars.borderRadius.xl,
  transform: 'translate3d(-50%, -50%, 0) scale(1) rotate(0deg)',
  transformOrigin: 'center center',

  transition: `width 700ms ${animationCurve}, height 700ms ${animationCurve}`,
  selectors: {
    '&[data-activate=true]': {
      opacity: 1,
      transform: 'translate3d(-50%, -50%, 0) rotate(15deg) scale(2)',
      width: '1000px',
      height: '728px',
    },
  },
});

export const container = style(
  responsiveStyle({
    mobile: {
      display: 'none',
    },
    tablet: {
      display: 'block',
    },
  }),
);

export const backgroundSecondStep = style([
  bgFullAnimation,
  {
    background:
      'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
  },
]);

export const backgroundThirdStep = style([
  bgFullAnimation,
  {
    background: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  },
]);
