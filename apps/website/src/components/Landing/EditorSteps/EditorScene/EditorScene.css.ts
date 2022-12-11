import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const container = style(
  responsiveStyle({
    mobile: {
      position: 'sticky',
      maxHeight: '60vh',
      height: '100%',
      width: '100%',
      flex: 1,
      display: 'flex',
      borderRadius: themeVars.borderRadius.xl,
      overflow: 'hidden',
      clipPath: 'border-box',
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
  left: 0,
  top: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
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
