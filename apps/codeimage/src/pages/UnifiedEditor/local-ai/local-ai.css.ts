import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reduce = '(prefers-reduced-motion: reduce)';

/** The height of the action bar the prompt bar takes the place of. */
export const barHeight = createVar();

const enter = {
  transition: `opacity 200ms ${ease}, transform 200ms ${ease}`,
  '@starting-style': {opacity: 0, transform: 'translateY(6px)'},
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      '@starting-style': {transform: 'none'},
    },
  },
} as const;

// Over the action bar, which stays in the layout under it, so the canvas
// keeps its size. The bar grows upward, with the todo list above.
export const slot = style({
  vars: {[barHeight]: '48px'},
  position: 'absolute',
  bottom: 0,
  left: '50%',
  translate: '-50% 0',
  width: 'min(560px, calc(100vw - 32px))',
  height: barHeight,
  // Above the canvas and the frame, which come earlier in every layout.
  zIndex: 10,
  pointerEvents: 'auto',
});

export const stack = style({
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

/** The island of the canvas toolbar, with the field in place of its buttons. */
export const bar = style({
  ...enter,
  display: 'flex',
  alignItems: 'flex-end',
  gap: '4px',
  boxSizing: 'border-box',
  minHeight: barHeight,
  padding: '6px',
  borderRadius: '18px',
  background: c.panel.background,
  color: c.panel.textColor,
});

export const field = style({flex: 1, minWidth: 0});

export const input = style({
  boxSizing: 'border-box',
  minHeight: `calc(${barHeight} - 12px)`,
  maxHeight: '132px',
  padding: '8px 12px',
  borderRadius: '12px',
  fontSize: '14px',
  lineHeight: '20px',
  resize: 'none',
  overflowY: 'auto',
});

/** The run, as the agent activity card draws its calls. */
export const panel = style({
  ...enter,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  boxSizing: 'border-box',
  maxHeight: 'min(360px, 50dvh)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '10px 10px 12px',
  borderRadius: '18px',
  color: c.baseText,
  background: c.dialog.panelBackgroundColor,
  boxShadow: c.dialog.panelShadow,
  fontSize: '13px',
  scrollbarWidth: 'thin',
});

export const asked = style({
  margin: 0,
  padding: '0 6px',
  overflow: 'hidden',
  color: c.descriptionTextColor,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const thinking = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  margin: 0,
  padding: '6px 8px',
  fontWeight: themeVars.fontWeight.medium,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const outcome = style({
  margin: 0,
  padding: '0 6px',
  color: c.descriptionTextColor,
  fontSize: '12px',
  selectors: {
    '&:empty': {display: 'none'},
    '&[data-failed]': {color: c.button.danger.backgroundColor},
  },
});

/** What the model wrote between its calls. */
export const note = style({
  padding: '4px 8px',
  color: c.descriptionTextColor,
  whiteSpace: 'pre-wrap',
});

/** The model's last words, under its calls. */
export const answer = style({
  // The panel is a scrolling flex column: a clamped box, whose overflow is
  // hidden, would otherwise shrink to nothing.
  flexShrink: 0,
  margin: 0,
  padding: '6px 8px 2px',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  selectors: {
    '&[data-clamped]': {
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
  },
});

export const panelAction = style({alignSelf: 'flex-start'});
