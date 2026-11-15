import {themeVars, withThemeMode} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
/** Same breakpoint as the app's `useModality`. */
const phone = 'screen and (max-width: 768px)';
const desktop = 'screen and (min-width: 769px)';
/** Under this the right pane is too narrow for a text and a wide control side by side. */
const narrow = 'screen and (max-width: 900px)';
/** Under this a row has no room for a picture, a text and a button side by side. */
const cramped = 'screen and (max-width: 560px)';
const finePointer = '(hover: hover) and (pointer: fine)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

/*
 * The dialog in two panes. On the left, the search and the sections, on the
 * dialog's own surface. On the right, the section on screen, on the app's
 * background, so that its groups are islands as the editor's panels are.
 *
 * On a phone the left pane turns into rows on top: the search with the
 * close button, then the sections as tabs, three to a row. Six sections do
 * not need a screen of their own, and the search stays in reach.
 */
export const shell = style({
  display: 'grid',
  gridTemplateColumns: '232px minmax(0, 1fr)',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gridTemplateAreas: '"search head" "nav body"',
  height: 'min(680px, calc(100dvh - 32px))',
  color: c.baseText,
  selectors: {
    // In light mode the app's background is the dialog's white, so the left
    // pane takes the grey of the islands there.
    ...withThemeMode({light: {background: c.background}}),
  },
  '@media': {
    [phone]: {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gridTemplateRows: 'auto auto minmax(0, 1fr)',
      gridTemplateAreas: '"search close" "nav nav" "body body"',
      height: 'calc(100dvh - 16px)',
    },
  },
});

// The kit sizes its panel in steps: 768px, then the full 1024px of a small
// laptop. This panel is wide and still leaves the page a margin.
globalStyle(`div:has(> ${shell})`, {
  '@media': {
    [desktop]: {width: 'min(1000px, calc(100vw - 32px))'},
    [phone]: {width: 'calc(100vw - 16px)'},
  },
});

/* The left pane */

export const search = style({
  gridArea: 'search',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: `${themeVars.spacing['3']} ${themeVars.spacing['3']} ${themeVars.spacing['2']}`,
  '@media': {
    [phone]: {
      padding: `${themeVars.spacing['2']} ${themeVars.spacing['1']} ${themeVars.spacing['2']} ${themeVars.spacing['2']}`,
    },
  },
});

globalStyle(`${search} input`, {paddingLeft: '34px'});

export const searchIcon = style({
  position: 'absolute',
  left: `calc(${themeVars.spacing['3']} + 10px)`,
  top: '50%',
  zIndex: 1,
  display: 'flex',
  marginTop: '2px',
  color: c.descriptionTextColor,
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  '@media': {
    [phone]: {left: `calc(${themeVars.spacing['2']} + 10px)`, marginTop: 0},
  },
});

// The key that focuses the search, as long as the field is empty.
export const searchKey = style({
  position: 'absolute',
  right: `calc(${themeVars.spacing['3']} + 8px)`,
  top: '50%',
  marginTop: '2px',
  padding: '1px 6px',
  borderRadius: '6px',
  background: c.button.base.backgroundColor,
  color: c.descriptionTextColor,
  font: 'inherit',
  fontSize: '11px',
  lineHeight: '16px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  selectors: {
    [`${search}:has(input:not(:placeholder-shown)) &`]: {display: 'none'},
    [`${search}:has(input:focus) &`]: {display: 'none'},
  },
  '@media': {[phone]: {display: 'none'}},
});

export const nav = style({
  gridArea: 'nav',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minHeight: 0,
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['3']} ${themeVars.spacing['3']}`,
  overflowY: 'auto',
  '@media': {
    // Six labels are wider than a phone, so they take two rows of three
    // rather than hide some of them past the edge.
    [phone]: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: themeVars.spacing['1'],
      padding: `0 ${themeVars.spacing['2']} ${themeVars.spacing['2']}`,
    },
  },
});

export const navItem = style({
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  gap: '10px',
  height: '36px',
  padding: '0 10px',
  border: 0,
  borderRadius: '10px',
  background: 'transparent',
  color: c.descriptionTextColor,
  font: 'inherit',
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  textAlign: 'left',
  cursor: 'pointer',
  transition: `background-color 120ms ease, color 120ms ease, transform 120ms ${easeOut}`,
  selectors: {
    '&:active': {transform: 'scale(0.98)'},
    '&:focus-visible': focusRing,
    '&[aria-current]': {
      background: c.input.backgroundColor,
      color: c.baseText,
    },
    ...withThemeMode(
      {light: {background: themeVars.backgroundColor.white}},
      '&[aria-current]',
    ),
  },
  '@media': {
    [finePointer]: {
      selectors: {
        '&:hover:not([aria-current])': {color: c.baseText},
      },
    },
    [reducedMotion]: {
      transition: 'none',
      selectors: {'&:active': {transform: 'none'}},
    },
    [phone]: {
      justifyContent: 'center',
      height: '40px',
      padding: '0 4px',
      whiteSpace: 'nowrap',
    },
  },
});

export const navIcon = style({
  display: 'flex',
  '@media': {[phone]: {display: 'none'}},
});

/* The right pane */

const pane = {
  background: c.panel.background,
} as const;

export const head = style({
  gridArea: 'head',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['3'],
  padding: `${themeVars.spacing['3']} ${themeVars.spacing['3']} ${themeVars.spacing['2']} ${themeVars.spacing['6']}`,
  ...pane,
  // The close button joins the search's row, and the tabs say where you are.
  '@media': {[phone]: {display: 'contents'}},
});

export const crumbs = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  margin: 0,
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
  '@media': {
    [phone]: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    },
  },
});

export const crumbRoot = style({
  color: c.descriptionTextColor,
  fontWeight: themeVars.fontWeight.medium,
});

export const crumbSlash = style({color: c.descriptionTextColor, opacity: 0.6});

export const close = style({
  '@media': {
    [phone]: {
      gridArea: 'close',
      alignSelf: 'center',
      marginRight: themeVars.spacing['2'],
    },
  },
});

export const body = style({
  gridArea: 'body',
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['6'],
  minHeight: 0,
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['6']} ${themeVars.spacing['6']}`,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  ...pane,
  '@media': {
    [phone]: {
      gap: themeVars.spacing['5'],
      padding: `${themeVars.spacing['4']} ${themeVars.spacing['3']} calc(${themeVars.spacing['4']} + env(safe-area-inset-bottom, 0px))`,
    },
  },
});

/** What a section is, in one line, with its action beside it. */
export const intro = style({
  display: 'flex',
  flex: 'none',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${themeVars.spacing['2']} ${themeVars.spacing['4']}`,
  minHeight: '36px',
  padding: '0 4px',
  marginBottom: `calc(${themeVars.spacing['2']} * -1)`,
});

export const introText = style({
  margin: 0,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
});

export const group = style({
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  gap: themeVars.spacing['2'],
  minWidth: 0,
});

export const groupTitle = style({
  margin: 0,
  padding: '0 4px',
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
});

// One island for the rows of a group. Space sets the rows apart, not lines.
export const island = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 0',
  borderRadius: '16px',
  background: c.background,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['6'],
  minHeight: '56px',
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['4']}`,
  boxSizing: 'border-box',
  selectors: {
    '&[data-wide]': {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: themeVars.spacing['3'],
      padding: `${themeVars.spacing['3']} ${themeVars.spacing['4']} ${themeVars.spacing['2']}`,
    },
  },
  '@media': {
    [narrow]: {
      gap: themeVars.spacing['3'],
      selectors: {
        // A segmented control goes under its text, at full width.
        '&:not([data-small])': {
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: `${themeVars.spacing['3']} ${themeVars.spacing['4']}`,
        },
      },
    },
  },
});

export const rowText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  selectors: {[`${row}[data-picture] &`]: {flex: 1}},
});

export const historyLink = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  textUnderlineOffset: '3px',
});

export const rowTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
});

export const rowDescription = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.4,
});

export const rowControl = style({
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  justifyContent: 'flex-end',
  minWidth: 0,
  selectors: {
    [`${row}[data-wide] &`]: {display: 'block'},
  },
});

// The picture of an archive row, before its text. On a phone it gets
// smaller and the button goes under the text, so the text keeps its width.
export const rowPicture = style({
  flex: 'none',
  gridArea: 'picture',
  alignSelf: 'start',
  width: '104px',
  height: '64px',
  '@media': {[cramped]: {width: '80px', height: '50px'}},
});

globalStyle(`${row}[data-picture]`, {
  gap: themeVars.spacing['4'],
  '@media': {
    [cramped]: {
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      gridTemplateAreas: '"picture text" "picture control"',
      rowGap: themeVars.spacing['2'],
      columnGap: themeVars.spacing['3'],
    },
  },
});
globalStyle(`${row}[data-picture] > ${rowText}`, {gridArea: 'text'});
// A long title in a narrow row puts its tags on the next line.
globalStyle(`${row}[data-picture] ${rowTitle}`, {flexWrap: 'wrap'});
globalStyle(`${row}[data-picture] > ${rowControl}`, {
  gridArea: 'control',
  justifyContent: 'flex-start',
});
globalStyle(`${row}[data-picture] > ${rowControl}:empty`, {display: 'none'});

/* Controls */

// The kit's segmented control fills its parent, so it gets one with a size.
// Its tabs are 8px lower than the track, so the track grows on a phone to
// keep each tab a 36px target.
// A slider as wide as a segmented control of three options.
export const range = style({
  display: 'flex',
  alignItems: 'center',
  flex: 'none',
  width: '252px',
  '@media': {
    [narrow]: {width: '100%'},
  },
});

export const segmented = style({
  display: 'flex',
  flex: 'none',
  width: '252px',
  height: '36px',
  selectors: {
    '&[data-count="2"]': {width: '168px'},
    '&[data-count="4"]': {width: '336px'},
  },
  '@media': {
    [narrow]: {
      width: '100%',
      selectors: {
        '&[data-count="2"]': {width: '100%'},
        '&[data-count="4"]': {width: '100%'},
      },
    },
    [phone]: {height: '44px'},
  },
});

/** A value to read, not to change. */
export const value = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
  fontVariantNumeric: 'tabular-nums',
});

export const empty = style({
  margin: 0,
  padding: `${themeVars.spacing['12']} 0`,
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
  textAlign: 'center',
});

/* Choices with a picture: three across, stacked on a phone. */

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: themeVars.spacing['2'],
  '@media': {
    [phone]: {gridTemplateColumns: 'minmax(0, 1fr)'},
  },
});

export const card = style({position: 'relative', display: 'flex'});

// A card on the island, with no border. The selected one gets a ring, as the
// theme cards do.
export const cardLabel = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: themeVars.spacing['1'],
  padding: themeVars.spacing['3'],
  borderRadius: '12px',
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
    'input:focus-visible + &': focusRing,
    // The island is grey in light mode, so the card is white there.
    ...withThemeMode({light: {background: themeVars.backgroundColor.white}}),
  },
  '@media': {
    [reducedMotion]: {
      transition: 'none',
      selectors: {'&:active': {transform: 'none'}},
    },
    [phone]: {
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
  borderRadius: '8px',
  background: c.panel.background,
  color: c.baseText,
  selectors: {
    ...withThemeMode({light: {background: c.background}}),
  },
  '@media': {
    [phone]: {
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
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  // As tall with the Default tag as without it.
  minHeight: '20px',
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  selectors: {
    [`${card}[data-checked] &`]: {fontWeight: themeVars.fontWeight.semibold},
  },
});

/** Marks the choice that is on before any other is made. */
export const tag = style({
  padding: '1px 6px',
  borderRadius: '6px',
  background: c.button.base.backgroundColor,
  color: c.descriptionTextColor,
  fontSize: '11px',
  fontWeight: themeVars.fontWeight.medium,
  lineHeight: '14px',
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

/* The colour mode orbs. Their fills are fixed; only the rim and stars follow the theme. */
export const orb = style({display: 'block', overflow: 'visible'});
export const orbRim = style({
  stroke: 'currentColor',
  strokeOpacity: 0.18,
  strokeWidth: 1,
});
export const orbStars = style({fill: 'currentColor', opacity: 0.45});
export const orbSeam = style({
  stroke: '#ffffff',
  strokeOpacity: 0.35,
  strokeWidth: 0.75,
});

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
