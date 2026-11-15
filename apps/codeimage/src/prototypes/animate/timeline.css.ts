import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const tint = (amount: number) =>
  `color-mix(in srgb, ${c.primary} ${amount}%, transparent)`;

export const timeline = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
  userSelect: 'none',
  WebkitUserSelect: 'none',
});

// The only place that scrubs: a click or a drag here moves the playhead.
export const ruler = style({
  position: 'relative',
  height: '22px',
  borderRadius: '8px',
  cursor: 'ew-resize',
  touchAction: 'none',
  background: c.input.backgroundColor,
});

export const tick = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '4px',
  borderLeft: `1px solid ${c.divider}`,
  fontSize: '10px',
  fontVariantNumeric: 'tabular-nums',
  color: c.descriptionTextColor,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
});

export const tracks = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const lane = style({
  position: 'relative',
  height: '40px',
  selectors: {
    '&[data-lane="transition"]': {height: '28px'},
    '&[data-lane="block"]': {height: '48px'},
  },
});

export const laneLabel = style({
  position: 'absolute',
  left: '-2px',
  top: '-15px',
  fontSize: '10px',
  color: c.descriptionTextColor,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
});

export const segment = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  padding: '0 10px',
  overflow: 'hidden',
  borderRadius: '10px',
  cursor: 'pointer',
  color: c.baseText,
  background: c.button.base.backgroundColor,
  boxShadow: `inset 0 0 0 1px transparent`,
  fontSize: '12px',
  outline: 'none',
  transition: `box-shadow 150ms ${easeOut}, background-color 150ms ease`,
  selectors: {
    '&[data-kind="transition"]': {
      justifyContent: 'center',
      padding: '0 6px',
      color: c.primary,
      background: `repeating-linear-gradient(135deg, ${tint(16)} 0 6px, ${tint(8)} 6px 12px)`,
    },
    '&[data-selected]': {
      boxShadow: `inset 0 0 0 2px ${c.primary}`,
    },
    '&[data-current]:not([data-selected])': {
      boxShadow: `inset 0 0 0 1px ${tint(55)}`,
    },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 2px ${c.primary}, 0 0 0 3px ${tint(30)}`,
    },
    // Inside a step block: the block draws the corners.
    '&[data-in-block]': {borderRadius: 0},
    '&[data-in-block][data-kind="hold"]': {borderRadius: '10px 0 0 10px'},
    '&[data-in-block][data-kind="transition"]': {
      borderRadius: '0 10px 10px 0',
    },
    '&[data-in-block][data-kind="hold"][data-last]': {borderRadius: '10px'},
  },
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:not([data-selected]):hover': {
          boxShadow: `inset 0 0 0 1px ${c.divider}`,
        },
      },
    },
  },
});

export const segmentText = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const stepNumber = style({
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  width: '18px',
  height: '18px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  background: c.input.backgroundColor,
  color: c.descriptionTextColor,
});

export const duration = style({
  marginLeft: 'auto',
  flex: 'none',
  fontSize: '11px',
  fontVariantNumeric: 'tabular-nums',
  color: c.descriptionTextColor,
  selectors: {
    [`${segment}[data-kind="transition"] &`]: {
      marginLeft: 0,
      color: 'inherit',
    },
  },
});

// The right edge of a segment. A wider target than it looks.
export const handle = style({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: '10px',
  cursor: 'ew-resize',
  touchAction: 'none',
  selectors: {
    '&::after': {
      content: '',
      position: 'absolute',
      top: '25%',
      bottom: '25%',
      right: '3px',
      width: '3px',
      borderRadius: '2px',
      background: c.descriptionTextColor,
      opacity: 0,
      transition: `opacity 120ms ease`,
    },
    [`${segment}[data-selected] &::after, ${segment}:hover &::after, &[data-dragging]::after`]:
      {opacity: 0.8},
  },
});

export const block = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  borderRadius: '10px',
});

export const blockLabel = style({
  position: 'absolute',
  left: '2px',
  top: '-16px',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '10px',
  color: c.descriptionTextColor,
});

export const playhead = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 0,
  pointerEvents: 'none',
  zIndex: 2,
  selectors: {
    '&::before': {
      content: '',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '-1px',
      width: '2px',
      background: c.primary,
    },
  },
});

// The knob on the ruler, which drags the playhead.
export const playheadKnob = style({
  position: 'absolute',
  top: '3px',
  left: '-7px',
  width: '14px',
  height: '16px',
  borderRadius: '5px',
  background: c.primary,
  pointerEvents: 'auto',
  cursor: 'ew-resize',
  touchAction: 'none',
});

const appear = keyframes({
  from: {opacity: 0, transform: 'translate(-50%, 4px) scale(0.97)'},
});

export const dragValue = style({
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  transform: 'translateX(-50%)',
  padding: '3px 7px',
  borderRadius: '6px',
  fontSize: '11px',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  color: c.button.primary.textColor,
  background: c.button.primary.backgroundColor,
  pointerEvents: 'none',
  zIndex: 3,
  animation: `${appear} 120ms ${easeOut}`,
});

export const curveGlyph = style({
  flex: 'none',
  width: '16px',
  height: '12px',
  overflow: 'visible',
});

globalStyle(`${curveGlyph} path`, {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
});
