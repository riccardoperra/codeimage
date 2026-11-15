import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {
  curve,
  duration,
  illustrationAt,
  illustrationFor,
  ms,
  reduceMotion as reduce,
  showcaseFor,
} from './motion';

const c = themeVars.dynamicColors;
const ease = curve.out;
const ring = 'rgba(128,128,128,.16)';
const lift = '0 20px 60px rgba(0,0,0,.2)';
const floating = style({
  color: c.baseText,
  background: c.background,
  borderRadius: '18px',
});

// The Nudge rises from the bottom edge it sits on, as a toast does, and
// leaves the same way, faster. Its shadow is a filter so that it follows
// the clip that reveals the expanded card.
export const nudge = style({
  position: 'fixed',
  left: '28px',
  bottom: '28px',
  zIndex: 40,
  width: '340px',
  maxWidth: 'calc(100vw - 24px)',
  filter: `drop-shadow(${lift})`,
  transition: `opacity ${ms(duration.nudgeIn)} ${curve.toast}, transform ${ms(duration.nudgeIn)} ${curve.toast}`,
  '@starting-style': {opacity: 0, transform: 'translateY(100%)'},
  selectors: {
    '&[data-closing]': {
      opacity: 0,
      transform: 'translateY(100%)',
      pointerEvents: 'none',
      transitionDuration: ms(duration.nudgeOut),
      transitionTimingFunction: ease,
    },
  },
  '@media': {
    'screen and (max-width: 768px)': {
      left: '12px',
      bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    },
    [reduce]: {
      transitionProperty: 'opacity',
      '@starting-style': {transform: 'none'},
      selectors: {'&[data-closing]': {transform: 'none'}},
    },
  },
});
const face = style([floating, {boxShadow: `inset 0 0 0 1px ${ring}`}]);
export const collapsed = style([
  face,
  {display: 'flex', alignItems: 'center', gap: '10px', padding: '12px'},
]);
export const summary = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: '3px',
  fontSize: '13px',
});
export const muted = style({color: c.descriptionTextColor, fontSize: '12px'});
// See reveals the expanded card upward from the height of the bar it
// replaces. A clip, so that no layout property animates.
export const expanded = style([
  face,
  {
    padding: '10px 10px 12px',
    clipPath: 'inset(0 round 18px)',
    transition: `clip-path ${ms(duration.reveal)} ${ease}`,
    '@starting-style': {
      clipPath: 'inset(calc(100% - var(--nudge-from)) 0 0 0 round 18px)',
    },
    '@media': {[reduce]: {transition: 'none'}},
  },
]);
// The content fades in under the clip, so the bar's text does not jump.
export const revealed = style({
  transition: `opacity ${ms(duration.reveal)} ${ease}`,
  '@starting-style': {opacity: 0},
});
// The steps share one grid cell, so the step that leaves fades over the one
// that arrives, without taking space. Next moves forward: the new step comes
// from the right and the old one leaves to the left.
export const stage = style({display: 'grid'});
export const slide = style({
  gridArea: '1 / 1',
  transition: `opacity ${ms(duration.step)} ${ease}, transform ${ms(duration.step)} ${ease}`,
  selectors: {
    '&:not(:only-child)': {
      '@starting-style': {opacity: 0, transform: 'translateX(8px)'},
    },
    '&[data-leaving]': {opacity: 0, transform: 'translateX(-8px)'},
  },
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      selectors: {
        '&:not(:only-child)': {'@starting-style': {transform: 'none'}},
        '&[data-leaving]': {transform: 'none'},
      },
    },
  },
});
// Steps from the keyboard swap at once.
globalStyle(`${nudge}[data-instant] *`, {transitionDuration: '0s'});
export const copy = style({padding: '14px 6px 4px'});
export const title = style({
  margin: '8px 0 4px',
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: 1.3,
});
export const body = style({
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: '13px',
  lineHeight: 1.5,
});
// Every step keeps room for three lines, so Next never resizes the card.
globalStyle(`${slide} ${body}`, {minHeight: '3lh'});
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 6px 0',
});
export const steps = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  gap: '5px',
});
export const step = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: c.descriptionTextColor,
  opacity: 0.25,
  selectors: {'&[data-current]': {background: c.primary, opacity: 1}},
});
export const tag = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 6px',
  borderRadius: '6px',
  background: c.input.backgroundColor,
  color: c.descriptionTextColor,
  fontSize: '11px',
  fontWeight: 500,
});
export const illustration = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  height: '140px',
  borderRadius: '10px',
  background: c.panel.background,
  color: c.primary,
  overflow: 'hidden',
  selectors: {
    '&[data-mode="thumb"]': {
      height: '100%',
      padding: '4px',
      borderRadius: '8px',
    },
  },
});
// A thumbnail draws its picture at the size of its box.
globalStyle(`${illustration}[data-mode="thumb"] svg`, {
  width: '100%',
  height: '100%',
});
export const thumbWindow = style({fill: c.background});
export const miniWindow = style({
  width: '180px',
  color: c.baseText,
  lineHeight: 1.8,
  padding: '12px',
  borderRadius: '10px',
  background: c.background,
  boxShadow: '0 4px 16px rgba(0,0,0,.08)',
  fontSize: '11px',
});
export const redacted = style({color: c.primary, fontWeight: 600});
export const wireCanvas = style({fill: 'currentColor', opacity: 0.1});
export const wireFrame = style({fill: 'currentColor', opacity: 0.3});

/*
 * A picture in a Nudge step or a Showcase card explains its feature once,
 * when it appears. Each part ends where the still picture has it, so the
 * archive's thumbnails and reduced motion show the last frame. A Showcase
 * card sets `--whats-new-play-at` to start its picture after it lands.
 */
const playAt = (offset: number) =>
  `calc(var(--whats-new-play-at, ${ms(duration.playAt)}) + ${ms(offset)})`;
const plays = (
  name: string,
  length: number,
  offset: number,
  easing: string = ease,
) => {
  const playing = `${illustration}[data-mode="play"] &`;
  return style({
    selectors: {
      [playing]: {
        animation: `${name} ${ms(length)} ${easing} ${playAt(offset)} both`,
      },
    },
    '@media': {[reduce]: {selectors: {[playing]: {animation: 'none'}}}},
  });
};
const rise = keyframes({from: {opacity: 0, transform: 'translateY(6px)'}});
const fromLeft = keyframes({
  from: {opacity: 0, transform: 'translateX(-10px)'},
});
const fromRight = keyframes({from: {opacity: 0, transform: 'translateX(8px)'}});
const press = keyframes({'40%': {transform: 'scale(.9)'}});
const down = keyframes({from: {transform: 'translateY(-200%)'}});
const wipeIn = keyframes({from: {clipPath: 'inset(0 100% 0 0)'}});
const wipeOut = keyframes({from: {clipPath: 'inset(0)'}});

// Redact: the secret is read first, then dots replace it from the left.
export const secret = style({display: 'inline-grid'});
globalStyle(`${secret} > *`, {gridArea: '1 / 1'});
export const plain = style([
  plays(wipeOut, illustrationFor.redact, illustrationAt.redact, curve.inOut),
  {clipPath: 'inset(0 0 0 100%)'},
]);
export const dots = plays(
  wipeIn,
  illustrationFor.redact,
  illustrationAt.redact,
  curve.inOut,
);
// Tabs: one image per tab leaves the arrow, one after the other.
export const tabOut = illustrationAt.tabs.map(at =>
  plays(fromLeft, illustrationFor.tabs, at),
);
// Command menu: the shortcut is pressed, then a row is picked.
export const keycap = plays(
  press,
  illustrationFor.shortcut,
  illustrationAt.shortcut,
);
export const commandList = style({position: 'relative'});
export const commandPick = style([
  plays(
    down,
    illustrationFor.commandPick,
    illustrationAt.commandPick,
    curve.inOut,
  ),
  {
    position: 'absolute',
    insetInline: '-6px',
    top: 'calc(2 * 1.8em)',
    height: '1.8em',
    borderRadius: '5px',
    background: `color-mix(in srgb, ${c.primary} 16%, transparent)`,
  },
]);
// Layouts: each layout's panel docks from its own edge.
export const dockRight = plays(
  fromRight,
  illustrationFor.layout,
  illustrationAt.layout[0],
);
export const dockBottom = plays(
  rise,
  illustrationFor.layout,
  illustrationAt.layout[1],
);
export const dockLeft = plays(
  fromLeft,
  illustrationFor.layout,
  illustrationAt.layout[2],
);
// Theme cards: the three styles arrive in reading order.
export const themeStyle = illustrationAt.theme.map(at =>
  plays(rise, illustrationFor.theme, at),
);
export const commandAnchor = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
});
export const dotAnchor = style({
  display: 'inline-flex',
  flex: 'none',
  alignItems: 'center',
  verticalAlign: 'middle',
});
export const dot = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  padding: 0,
  border: 0,
  borderRadius: '50%',
  background: 'transparent',
  color: c.primary,
  cursor: 'pointer',
  transition: `transform ${ms(duration.press)} ${ease}`,
  '@media': {
    [reduce]: {
      transitionProperty: 'opacity',
      selectors: {'&:active': {transform: 'none'}},
    },
  },
  selectors: {
    '&:active': {transform: 'scale(.97)'},
    '&::after': {
      content: '""',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: 'currentColor',
      boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 12%, transparent)',
      // The dot fades as its coachmark grows out of it.
      transition: `opacity ${ms(duration.coachmarkIn)} ${ease}`,
    },
    '&[data-seen]::after': {opacity: 0},
    '&[data-instant]::after': {transition: 'none'},
    '&:focus-visible': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '1px',
    },
  },
});
globalStyle(`${commandAnchor} > ${dotAnchor}`, {
  position: 'absolute',
  right: '-9px',
  top: '-9px',
  zIndex: 1,
});
// A layout may give the buttons in its toolbar a taller touch target. The
// dot keeps its own, so that it does not cover the control it sits on.
globalStyle(`${commandAnchor} > ${dotAnchor} ${dot}`, {
  minWidth: 0,
  minHeight: 0,
});
// A dot on the corner of a filled control, which has the dot's colour.
export const filledAnchor = style({});
globalStyle(`${filledAnchor} > ${dotAnchor} ${dot}::after`, {
  boxShadow: `0 0 0 2px ${c.background}`,
});
// Kobalte keeps a closing popover mounted until its animation ends, so the
// exit is a keyframe while the entry is a transition.
const shrink = keyframes({to: {opacity: 0, transform: 'scale(.96)'}});
const fadeOut = keyframes({to: {opacity: 0}});
export const coachmark = style([
  floating,
  {
    boxShadow: `0 0 0 1px ${ring}, ${lift}`,
    transition: `opacity ${ms(duration.coachmarkIn)} ${ease}, transform ${ms(duration.coachmarkIn)} ${ease}`,
    width: '290px',
    maxWidth: 'calc(100vw - 24px)',
    padding: '10px 10px 12px',
    zIndex: 1000,
    outline: 'none',
    transformOrigin: 'var(--kb-popover-content-transform-origin)',
    '@starting-style': {opacity: 0, transform: 'scale(.96)'},
    selectors: {
      '&[data-closed]': {
        animation: `${shrink} ${ms(duration.coachmarkOut)} ${ease} forwards`,
      },
      '&[data-instant]': {transition: 'none', animation: 'none'},
    },
    '@media': {
      [reduce]: {
        transitionProperty: 'opacity',
        '@starting-style': {transform: 'none'},
        selectors: {'&[data-closed]': {animationName: fadeOut}},
      },
    },
  },
]);
/*
 * The Showcase opens once per major release, so it gets the one entrance
 * with room to breathe. The kit's sheet only fades, and its content arrives
 * as one wave: each part starts at its `--whats-new-at`.
 */
const fadeIn = keyframes({from: {opacity: 0}});
const enter = (rise: number, length: number) =>
  style({
    animation: `${keyframes({from: {opacity: 0, transform: `translateY(${rise}px)`}})} ${ms(length)} ${ease} var(--whats-new-at, 0ms) both`,
    '@media': {[reduce]: {animationName: fadeIn, animationDelay: '0ms'}},
  });
export const lead = enter(12, showcaseFor.lead);
export const support = enter(8, showcaseFor.support);
export const fade = style({
  animation: `${fadeIn} ${ms(showcaseFor.fade)} ${ease} var(--whats-new-at, 0ms) both`,
  '@media': {[reduce]: {animationDelay: '0ms'}},
});
export const sheetTitle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  height: '56px',
  padding: '0 24px',
  borderBottom: `1px solid ${c.input.backgroundColor}`,
  color: c.baseText,
  fontSize: themeVars.fontSize.lg,
  fontWeight: 500,
});
export const sheet = style({
  maxHeight: 'min(760px, calc(100dvh - 32px))',
  overflowY: 'auto',
  padding: '24px',
  color: c.baseText,
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '16px',
      maxHeight: 'calc(100dvh - 32px)',
    },
  },
});
globalStyle(`[role="dialog"][data-expanded]:has(> ${sheet})`, {
  animation: `${fadeIn} ${ms(showcaseFor.sheet)} ${ease}`,
});
export const hero = style({textAlign: 'center', padding: '28px 0 32px'});
export const heroTitle = style({
  fontSize: '34px',
  fontWeight: 600,
  letterSpacing: '-.02em',
  margin: '16px 0 10px',
});
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px',
  '@media': {
    'screen and (max-width: 768px)': {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});
export const card = style([
  enter(8, showcaseFor.card),
  {
    padding: '12px',
    borderRadius: '16px',
    background: c.panel.background,
    selectors: {'&:first-child': {gridColumn: '1 / -1'}},
  },
]);
export const sheetFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '12px',
  paddingTop: '24px',
});
export const link = style({
  color: c.descriptionTextColor,
  fontSize: '12px',
  textUnderlineOffset: '3px',
});
// The kit's buttons already scale to .97 on press. Here they only keep still
// when motion is reduced.
globalStyle(
  `${nudge} button:active, ${coachmark} button:active, ${sheet} button:active`,
  {'@media': {[reduce]: {transform: 'none'}}},
);
