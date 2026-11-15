import {themeVars} from '@codeimage/ui';
import {createVar, globalStyle, keyframes, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
const phone = '(max-width: 768px)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const position = createVar();
export const start = createVar();
export const size = createVar();

/* Picker */
export const picker = style({
  position: 'fixed',
  top: 60,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: 4,
  borderRadius: 999,
  background: themeVars.backgroundColor.gray['800'],
  color: themeVars.backgroundColor.white,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,.25)',
  maxWidth: 'calc(100vw - 16px)',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '@media': {
    [phone]: {
      fontSize: 11,
      left: 8,
      top: 'auto',
      bottom: 92,
      transform: 'none',
      maxWidth: 150,
    },
  },
});
export const pickerNote = style({
  opacity: 0.4,
  '@media': {[phone]: {display: 'none'}},
});
export const pickerButton = style({
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  padding: '6px 10px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  opacity: 0.7,
  transition: `background 120ms ease, opacity 120ms ease, transform 160ms ${easeOut}`,
  selectors: {
    '&[aria-pressed="true"]': {background: 'rgba(255,255,255,.16)', opacity: 1},
    '&:hover': {opacity: 1},
    '&:active': {transform: 'scale(0.97)'},
  },
  '@media': {[phone]: {padding: '6px 8px'}},
});
export const pickerKey = style({opacity: 0.5, marginRight: 4});
export const pickerDivider = style({
  width: 1,
  alignSelf: 'stretch',
  margin: '4px 4px',
  background: 'rgba(255,255,255,.2)',
  flexShrink: 0,
});

/* Scrubber (B, C) */
export const scrubber = style({
  position: 'relative',
  height: 28,
  cursor: 'pointer',
  touchAction: 'none',
  outlineOffset: 2,
  borderRadius: themeVars.borderRadius.md,
  '@media': {[phone]: {height: 40}},
});
export const scrubTrack = style({
  position: 'absolute',
  left: 0,
  right: 0,
  top: '50%',
  height: 6,
  marginTop: -3,
  borderRadius: 999,
  background: c.panel.background,
  overflow: 'hidden',
});
export const scrubFill = style({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: position,
  background: c.primary,
});
export const scrubNotch = style({
  position: 'absolute',
  left: position,
  top: '50%',
  width: 2,
  height: 12,
  marginTop: -6,
  marginLeft: -1,
  borderRadius: 1,
  background: c.baseText,
  opacity: 0.35,
  pointerEvents: 'none',
});
export const scrubKnob = style({
  position: 'absolute',
  left: position,
  top: '50%',
  width: 14,
  height: 14,
  margin: '-7px 0 0 -7px',
  borderRadius: '50%',
  background: c.primary,
  boxShadow: `0 0 0 3px ${c.dialog.panelBackgroundColor}`,
  pointerEvents: 'none',
});

/* Step list (B, F) */
export const list = style({
  display: 'grid',
  gap: 2,
  maxHeight: 216,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  margin: '0 -4px',
  padding: '0 4px',
  scrollbarWidth: 'thin',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  columnGap: 12,
  alignContent: 'start',
  '@media': {
    [phone]: {maxHeight: 'min(208px, 26vh)', gridTemplateColumns: '1fr'},
  },
});
export const listHead = style({
  gridTemplateColumns: '28px minmax(0,1fr) 96px 72px',
  gap: 8,
  padding: '0 10px',
  fontSize: 11,
  opacity: 0.55,
  display: 'none',
  '@media': {
    [phone]: {
      display: 'grid',
      gridTemplateColumns: '24px minmax(0,1fr) 84px 60px',
    },
  },
});
export const unit = style({
  opacity: 0.5,
  '@media': {[phone]: {display: 'none'}},
});
export const row = style({
  display: 'grid',
  gridTemplateColumns: '24px minmax(0,1fr) 84px 76px',
  alignItems: 'center',
  gap: 8,
  minHeight: 36,
  padding: '0 10px',
  border: 0,
  borderRadius: themeVars.borderRadius.md,
  background: 'transparent',
  color: c.baseText,
  font: 'inherit',
  fontSize: 13,
  textAlign: 'left',
  cursor: 'pointer',
  position: 'relative',
  transition: `background 120ms ease, transform 160ms ${easeOut}`,
  selectors: {
    '&:hover': {background: c.panel.background},
    '&:active': {transform: 'scale(0.99)'},
    '&[data-selected]': {
      background: c.panel.background,
      boxShadow: `inset 0 0 0 2px ${c.primary}`,
    },
    '&[data-current]::before': {
      content: '""',
      position: 'absolute',
      left: 2,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: 2,
      background: c.primary,
    },
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
    '&[data-readonly]': {cursor: 'default'},
  },
  '@media': {
    [phone]: {
      minHeight: 40,
      gridTemplateColumns: '24px minmax(0,1fr) 84px 60px',
      fontSize: 13,
    },
  },
});
export const index = style({
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.6,
  fontSize: 12,
});
export const name = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const metric = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  whiteSpace: 'nowrap',
});
export const muted = style({opacity: 0.4});

/* Step editor sheet / popover */
export const editor = style({
  display: 'grid',
  gap: 12,
  width: 340,
  maxWidth: 'calc(100vw - 32px)',
});
export const editorTitle = style({
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const editorRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minHeight: 36,
  flexWrap: 'wrap',
  '@media': {[phone]: {minHeight: 40}},
});
export const editorSection = style({
  display: 'grid',
  gap: 8,
  paddingTop: 12,
  borderTop: `1px solid ${c.divider}`,
});
export const sectionLabel = style({fontSize: 11, opacity: 0.6, margin: 0});
export const actions = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
});
globalStyle(`${editor} [data-cui="button"]`, {justifyContent: 'center'});
globalStyle(`${editorRow} > div`, {flex: 1, justifyContent: 'space-between'});
globalStyle(
  `${editor} [data-cui="button"], ${editor} input, ${editor} [data-cui="icon-button"]`,
  {
    '@media': {[phone]: {minHeight: 40}},
  },
);

const overlayIn = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const sheetIn = keyframes({
  from: {transform: 'translateY(100%)'},
  to: {transform: 'translateY(0)'},
});
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(0,0,0,.4)',
  animation: `${overlayIn} 200ms ease`,
});
export const sheet = style({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 51,
  padding: '8px 16px calc(16px + env(safe-area-inset-bottom))',
  borderRadius: `${themeVars.borderRadius.xl} ${themeVars.borderRadius.xl} 0 0`,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  maxHeight: '80vh',
  overflowY: 'auto',
  animation: `${sheetIn} 260ms cubic-bezier(0.32, 0.72, 0, 1)`,
  outline: 'none',
});
globalStyle(`${sheet} ${editor}`, {width: 'auto', maxWidth: 'none'});
export const grabber = style({
  width: 36,
  height: 4,
  borderRadius: 2,
  margin: '0 auto 12px',
  background: c.baseText,
  opacity: 0.2,
});
export const popover = style({
  padding: 16,
  width: 'max-content',
  maxWidth: 'none',
});

/* Preview only (C) */
export const chips = style({
  display: 'flex',
  gap: 6,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  margin: '0 -12px',
  padding: '0 12px',
});
export const chip = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 32,
  padding: '0 12px',
  border: 0,
  borderRadius: 999,
  background: c.panel.background,
  color: c.baseText,
  font: 'inherit',
  fontSize: 12,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&[data-current]': {
      background: c.primary,
      color: themeVars.backgroundColor.white,
    },
    '&:active': {transform: 'scale(0.97)'},
  },
});
export const hint = style({
  margin: 0,
  fontSize: 12,
  opacity: 0.65,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

/* Fit strip (E) */
export const fitHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  minHeight: 28,
});
export const fitScroller = style({
  minWidth: 0,
  overflowX: 'auto',
  padding: '2px 0',
  scrollbarWidth: 'thin',
});
export const fitScrollerFit = style({overflowX: 'hidden'});
export const minimap = style({
  position: 'relative',
  height: 12,
  borderRadius: 4,
  cursor: 'pointer',
  touchAction: 'none',
  '@media': {[phone]: {height: 24}},
});
export const minimapSegment = style({
  position: 'absolute',
  top: 2,
  bottom: 2,
  left: start,
  width: size,
  borderRadius: 2,
  background: `color-mix(in srgb, ${c.baseText} 30%, transparent)`,
  selectors: {
    '&[data-kind="transition"]': {
      background: `color-mix(in srgb, ${c.baseText} 12%, transparent)`,
    },
    '&[data-current]': {background: c.primary, opacity: 1},
  },
  '@media': {[phone]: {top: 7, bottom: 7}},
});
export const minimapWindow = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: start,
  width: size,
  borderRadius: 4,
  boxShadow: `inset 0 0 0 1.5px ${c.primary}`,
  background: 'rgba(120,120,255,.08)',
  pointerEvents: 'none',
});
export const minimapPlayhead = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: position,
  width: 2,
  marginLeft: -1,
  background: c.primary,
  pointerEvents: 'none',
});

/* Overview strip (F) */
export const overview = style({
  position: 'relative',
  height: 28,
  cursor: 'pointer',
  touchAction: 'none',
  outlineOffset: 2,
  '@media': {[phone]: {height: 40}},
});
export const overviewSegment = style({
  position: 'absolute',
  top: 6,
  bottom: 6,
  left: start,
  width: size,
  borderRadius: 3,
  background: `color-mix(in srgb, ${c.baseText} 30%, transparent)`,
  pointerEvents: 'none',
  transition: 'box-shadow 120ms ease',
  selectors: {
    '&[data-kind="transition"]': {
      background: `color-mix(in srgb, ${c.baseText} 12%, transparent)`,
      top: 11,
      bottom: 11,
    },
    '&[data-current]': {background: c.primary, opacity: 0.9},
    '&[data-selected]': {boxShadow: `0 0 0 2px ${c.primary}`},
  },
  '@media': {
    [phone]: {
      top: 10,
      bottom: 10,
      selectors: {'&[data-kind="transition"]': {top: 16, bottom: 16}},
    },
  },
});
export const overviewPlayhead = style({
  position: 'absolute',
  top: 2,
  bottom: 2,
  left: position,
  width: 2,
  marginLeft: -1,
  borderRadius: 1,
  background: c.primary,
  pointerEvents: 'none',
});
