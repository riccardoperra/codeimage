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
