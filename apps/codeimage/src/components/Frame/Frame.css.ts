import {createTheme, style} from '@vanilla-extract/css';
import {backgroundColorVar} from '../../theme/variables.css';
import {themeVars} from '../../theme/global.css';

export const [frameHandler, frameHandlerVars] = createTheme({
  scale: '1',
});

export const [frame, frameVars] = createTheme({
  backgroundColor: backgroundColorVar,
  radius: themeVars.borderRadius.lg,
  padding: '128px',
  opacity: '100%',
  visibility: 'visible',
  width: '730px',
  minWidth: '640px',
  minHeight: '150px',
  maxWidth: '1400px',
  controlHandleSize: '24px',
  controlHandleColor: themeVars.dynamicColors.frameDragControlBackgroundColor,
  controlOffset: '0px',
});

export const wrapper = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  overflowY: 'auto',
  overflowX: 'hidden',
  flex: '1',
  alignItems: 'center',
  justifyContent: 'center',
});

export const handler = style([
  {
    // TODO: this is a workaround to fix gutters and cursor in mobile view
    // zoom: `${frameHandlerVars.scale}`,
    transform: `scale(${frameHandlerVars.scale})`,
    display: 'block',
    position: 'relative',
    margin: 'auto',
  },
]);

export const content = style({
  width: '100%',
  height: '100%',
  marginTop: '20px',
  marginBottom: '40px',
  position: 'relative',
});

export const container = style([
  frame,
  {
    width: frameVars.width,
    maxWidth: frameVars.maxWidth,
    minWidth: frameVars.minWidth,
    minHeight: frameVars.minHeight,
    position: 'relative',
    borderRadius: frameVars.radius,
    padding: frameVars.padding,
    zIndex: 1,
    boxSizing: 'border-box',
    userSelect: 'none',
    transition: 'background-color .2s, padding .2s, border-radius .2s',
  },
]);

export const overlay = style({
  position: 'absolute',
  left: 0,
  top: 0,
  background: frameVars.backgroundColor,
  opacity: frameVars.opacity,
  visibility: frameVars.visibility,
  height: '100%',
  width: '100%',
  borderRadius: 'inherit',
});

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
      transform: 'translate(-50%, -50%) scale(2)',
    },
  },
  '::after': {
    content: '',
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '8px',
    height: '8px',
    borderRadius: themeVars.borderRadius.lg,
    boxShadow: themeVars.boxShadow.lg,
    transform: 'translate(-50%, -50%)',
    backgroundColor: frameVars.controlHandleColor,
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

export const resizeLine = style({
  position: 'absolute',
  bottom: -25,
  width: '100%',
  height: '15px',
  borderLeft: `1px solid ${themeVars.dynamicColors.resizeLineBackgroundColor}`,
  borderRight: `1px solid ${themeVars.dynamicColors.resizeLineBackgroundColor}`,
  display: 'flex',
});

export const resizeBadge = style([
  {
    borderRadius: themeVars.borderRadius.lg,
    padding: '0 1em',
    display: 'inline-block',
    fontSize: '12px',
    backgroundColor: themeVars.dynamicColors.resizeLineBadgeBackgroundColor,
    color: 'white',
    alignItems: 'center',
    margin: 'auto',
    zIndex: 10,
  },
]);

export const resizeLineDivider = style({
  position: 'absolute',
  borderColor: themeVars.dynamicColors.resizeLineBackgroundColor,
  left: 0,
  top: '50%',
  width: '100%',
  transform: 'transformY(50%)',
});

export const squaredBackgroundOverlay = style({
  backgroundImage: `
    linear-gradient(45deg,  ${themeVars.dynamicColors.emptySquareBackgroundColor} 25%,transparent 0),
    linear-gradient(-45deg, ${themeVars.dynamicColors.emptySquareBackgroundColor} 25%,transparent 0),
    linear-gradient(45deg,transparent 75%, ${themeVars.dynamicColors.emptySquareBackgroundColor} 0),
    linear-gradient(-45deg,transparent 75%, ${themeVars.dynamicColors.emptySquareBackgroundColor} 0)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0,0 10px, 10px -10px, -10px 0',
  zIndex: 1,
  position: 'absolute',
  width: '100%',
  height: '100%',
});

export const watermark = style({
  position: 'absolute',
  right: '32px',
  bottom: '24px',
});
