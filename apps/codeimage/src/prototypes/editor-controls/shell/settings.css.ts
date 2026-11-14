import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['5'],
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
  minWidth: 0,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.semibold,
});

export const sectionHint = style({
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});

/** Choices with a picture: three across, stacked on a phone. */
export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.spacing['2'],
  '@media': {
    'screen and (max-width: 560px)': {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});

export const card = style({position: 'relative', display: 'flex'});

// An island with no border, on the input surface in both modes: the dialog is
// white in light mode. The selected card gets a ring, as the theme cards do.
export const cardLabel = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: themeVars.spacing['1'],
  padding: themeVars.spacing['3'],
  borderRadius: '16px',
  background: c.input.backgroundColor,
  cursor: 'pointer',
  userSelect: 'none',
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&:active': {transform: 'scale(0.98)'},
    [`${card}[data-checked] &`]: {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '-2px',
    },
    'input:focus-visible + &': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '2px',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none',
      selectors: {'&:active': {transform: 'none'}},
    },
    'screen and (max-width: 560px)': {
      flexDirection: 'row',
      alignItems: 'center',
      gap: themeVars.spacing['3'],
    },
  },
});

export const preview = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '68px',
  marginBottom: themeVars.spacing['1'],
  borderRadius: '10px',
  background: c.panel.background,
  color: c.baseText,
  // White on the grey card, so the miniature reads as a screen.
  selectors: {
    ...withThemeMode({light: {background: themeVars.backgroundColor.white}}),
  },
  '@media': {
    'screen and (max-width: 560px)': {
      flex: 'none',
      width: '112px',
      marginBottom: 0,
    },
  },
});

export const cardText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const cardName = style({
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  selectors: {
    [`${card}[data-checked] &`]: {fontWeight: themeVars.fontWeight.semibold},
  },
});

export const cardHint = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.35,
});

/* The wireframes: the canvas and its frame in the text colour, the controls in the accent. */
export const wire = style({display: 'block'});
export const wireCanvas = style({fill: 'currentColor', opacity: 0.08});
export const wireFrame = style({fill: 'currentColor', opacity: 0.28});
export const wireControl = style({fill: c.primary});
export const wireControlSoft = style({fill: c.primary, opacity: 0.45});

// A row of an Aa list: the mark and a line of text.
export const listRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
});

export const listLine = style({
  width: '44px',
  height: '6px',
  borderRadius: '3px',
  background: 'currentColor',
  opacity: 0.28,
});

/** A label with one control beside it, 40px tall. */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['4'],
  minHeight: '40px',
  '@media': {
    'screen and (max-width: 560px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: themeVars.spacing['2'],
    },
  },
});

export const rowLabel = style({
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
});

// The kit's segmented control fills its parent, so it gets one with a size.
// Its tabs are 8px lower than the track, so the track grows on a phone to
// keep each tab a 36px target.
export const segmented = style({
  display: 'flex',
  flex: 'none',
  width: '320px',
  maxWidth: '100%',
  height: '36px',
  '@media': {
    'screen and (max-width: 560px)': {width: '100%', height: '44px'},
  },
});

export const segmentedNarrow = style([segmented, {width: '208px'}]);

export const links = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
});

export const version = style({
  marginLeft: 'auto',
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});
