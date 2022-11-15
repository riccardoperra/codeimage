import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const container = style([
  {
    maxHeight: '60vh',
    height: '100%',
    width: '100%',
    position: 'relative',
    flex: 1,
    display: 'flex',
    borderRadius: themeVars.borderRadius.xl,
    background: backgroundColorVar,
    overflow: 'hidden',
  },
]);

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
