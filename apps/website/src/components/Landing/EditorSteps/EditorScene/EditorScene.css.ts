import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';

export const container = style(
  responsiveStyle({
    mobile: {
      position: 'fixed',
      bottom: 0,
      maxHeight: '60vh',
      height: '100%',
      width: '100%',
      flex: 1,
      display: 'flex',
      borderRadius: themeVars.borderRadius.xl,
      background: backgroundColorVar,
      overflow: 'hidden',
    },
    tablet: {
      bottom: 'unset',
      position: 'relative',
      maxHeight: '60vh',
    },
  }),
);

export const circularProgressBox = style({
  position: 'absolute',
  left: '16px',
  top: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '75px',
  width: '75px',
});

export const editorContainerScale = createVar();

export const fixScaleContainer = style({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: `translate(-50%, -50%) scale(${editorContainerScale})`,
});

export const scrollDownContainer = style({
  position: 'absolute',
  bottom: '12px',
  left: '50%',
  margin: '0 auto',
  transform: `translateX(-50%)`,
});

export const scrollDownText = style({
  fontSize: '14px',
  marginTop: '8px',
});

export const bgFullAnimation = style({
  position: 'absolute',
  left: '16px',
  top: '16px',
  width: '45px',
  height: '45px',
  opacity: 1,
  margin: '16px',
  borderRadius: '50%',
  transform: 'translate(0, 0) scale(1)',
  transition: 'transform 600ms ease, width 450ms ease, height 450ms ease',
  selectors: {
    '&[data-activate=true]': {
      opacity: 1,
      transform: 'translate(0) scale(2)',
      width: '1280px',
      height: '1280px',
    },
  },
});

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
