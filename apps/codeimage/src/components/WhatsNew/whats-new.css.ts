import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {
  curve,
  duration,
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
    '&[data-instant]': {transition: 'none'},
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
      bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
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
    position: 'relative',
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
// Show me sits under the step it belongs to, out of the footer row, so
// Next and Done never shift sideways from one step to the next.
export const reveal = style({marginTop: '10px'});
export const nudgeClose = style({
  position: 'absolute',
  top: '8px',
  right: '8px',
  zIndex: 1,
});
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
const dotMark = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: 'currentColor',
  boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 12%, transparent)',
} as const;

/** Still indicator for the header, independent of feature-dot slots. */
export const unreadDot = style(dotMark);

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
      ...dotMark,
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
  maxHeight: 'min(760px, calc(100dvh - 112px))',
  overflowY: 'auto',
  padding: '24px',
  color: c.baseText,
  '@media': {
    'screen and (max-width: 768px)': {
      padding: '16px',
      maxHeight: 'calc(100dvh - 112px)',
    },
  },
});
globalStyle(
  `[data-expanded]:is([role="dialog"], [role="alertdialog"]):has(> ${sheet})`,
  {
    animation: `${fadeIn} ${ms(showcaseFor.sheet)} ${ease}`,
  },
);
export const hero = style({textAlign: 'center', padding: '28px 0 32px'});
export const heroTitle = style({
  fontSize: '34px',
  fontWeight: 600,
  letterSpacing: '-.02em',
  margin: '16px 0 10px',
});
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: '12px',
  '@media': {
    'screen and (max-width: 600px)': {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});
export const card = style([
  enter(8, showcaseFor.card),
  {
    minWidth: 0,
    gridColumn: 'span var(--whats-new-span, 2)',
    padding: '12px 12px 18px',
    borderRadius: '18px',
    background: c.panel.background,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'center',
    '@media': {'screen and (max-width: 600px)': {gridColumn: '1 / -1'}},
  },
]);
globalStyle(`:root[data-cui-theme="light"] ${card}`, {
  background: `color-mix(in srgb, ${c.baseText} 4%, ${c.panel.background})`,
});
globalStyle(`${card} > [data-picture]`, {flexShrink: 0});
globalStyle(`${card}:first-child > [data-picture]`, {
  height: '168px',
});
globalStyle(
  `${card}:not(:first-child):not(:nth-last-child(-n+3)) > [data-picture]`,
  {
    height: '140px',
  },
);
globalStyle(`${card} > ${copy}`, {
  padding: '0 4px',
  maxWidth: '44ch',
  alignSelf: 'center',
});
globalStyle(`${card} ${title}`, {fontSize: '17px', marginTop: '8px'});
globalStyle(`${card}:first-child ${title}`, {fontSize: '22px'});
globalStyle(`${card} ${actions}`, {justifyContent: 'center'});
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

export const accessories = style({paddingTop: '24px'});
export const alsoTitle = style({
  margin: '0 0 12px',
  fontSize: '13px',
  fontWeight: 600,
  color: c.descriptionTextColor,
});
export const accessory = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 0',
  borderBottom: `1px solid ${c.input.backgroundColor}`,
});
export const accessoryThumb = style({
  width: '64px',
  height: '44px',
  flexShrink: 0,
});
globalStyle(`${accessory} > button`, {flexShrink: 0});
export const accessoryCopy = style({flex: 1, minWidth: 0});
export const accessoryTitle = style({
  margin: '0 0 4px',
  fontSize: '13px',
  fontWeight: 600,
});
export const accessoryBody = style([body, {overflowWrap: 'anywhere'}]);

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});
