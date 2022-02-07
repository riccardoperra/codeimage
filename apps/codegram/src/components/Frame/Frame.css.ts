import {createTheme, style} from '@vanilla-extract/css';
import {backgroundColorVar} from '../../theme/variables.css';

export const [frame, frameVars] = createTheme({
  backgroundColor: backgroundColorVar,
  width: '520px',
  minWidth: '520px',
  minHeight: '150px',
  maxWidth: '920px',
  controlHandleSize: '24px',
  controlOffset: '0px',
});

export const container = style([
  frame,
  {
    backgroundColor: frameVars.backgroundColor,
    width: frameVars.width,
    minWidth: frameVars.minWidth,
    minHeight: frameVars.minHeight,
    position: 'relative',
    padding: 128,
    zIndex: 1,
    boxSizing: 'border-box',
    userSelect: 'none',
  },
]);

export const dragControls = style({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
});

export const dragControlHandler = style({
  vars: {
    [frameVars.controlOffset]: `calc(${frameVars.controlHandleSize} / 2 * -1)`,
  },
  selectors: {
    [`${dragControls} &`]: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      cursor: 'ew-resize',
      width: frameVars.controlHandleSize,
      height: frameVars.controlHandleSize,
    },
    '&:hover::after': {
      transform: 'transform: translate(-50%, -50%) scale(2)',
    },
  },
  '::after': {
    content: '',
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    transition: 'transform .1s ease',
  },
});

export const dragControlLeft = style([
  dragControlHandler,
  {left: frameVars.controlOffset},
]);

export const dragControlRight = style([
  dragControlHandler,
  {right: frameVars.controlOffset},
]);
