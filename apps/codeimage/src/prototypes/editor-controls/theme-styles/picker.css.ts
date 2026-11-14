import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const strongEaseOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const muted = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
});

/** Fills the container it is given; only the list scrolls. */
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
  height: '100%',
  minHeight: 0,
  minWidth: 0,
});

// Side by side in a wide tray, stacked in a narrow panel.
export const tools = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  flex: 'none',
});

// Both fit one row in a phone panel, 340px; a 320px desktop panel stacks them.
export const search = style({flex: '1 1 160px', minWidth: 0});

export const filter = style({flex: '1 1 168px', maxWidth: '320px'});

// The padding keeps focus rings and selection rings inside the scroller.
export const list = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  margin: `0 calc(${themeVars.spacing['2']} * -1)`,
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['2']} ${themeVars.spacing['4']}`,
  scrollbarWidth: 'thin',
});

export const empty = style([
  muted,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: themeVars.spacing['3'],
    padding: `${themeVars.spacing['4']} 0`,
  },
]);

/** A theme option without a border: a quiet surface that lights up on hover. */
export const option = style({
  position: 'relative',
  border: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  background: 'transparent',
  transition: `background-color 150ms ease-out, transform 160ms ${strongEaseOut}`,
  selectors: {
    '&:active': {transform: 'scale(0.98)'},
    '&:focus-visible': {
      outline: `2px solid ${themeVars.dynamicColors.primary}`,
      outlineOffset: '2px',
    },
  },
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {
        '&:hover': {background: themeVars.dynamicColors.input.backgroundColor},
        // The light input grey is almost the island grey; white reads.
        ...withThemeMode(
          {light: {background: themeVars.backgroundColor.white}},
          '&:hover',
        ),
      },
    },
    '(prefers-reduced-motion: reduce)': {transition: 'none'},
  },
});

export const card = style([
  option,
  {
    borderRadius: '16px',
    padding: themeVars.spacing['3'],
    background: themeVars.dynamicColors.input.backgroundColor,
    selectors: withThemeMode({
      light: {background: themeVars.backgroundColor.white},
    }),
    '@media': {
      '(hover: hover) and (pointer: fine)': {
        selectors: {
          '&:hover': {
            background: themeVars.dynamicColors.button.base.backgroundColor,
          },
          ...withThemeMode(
            {light: {background: themeVars.backgroundColor.gray['200']}},
            '&:hover',
          ),
        },
      },
    },
  },
]);

export const name = style({
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  lineHeight: 1.3,
  selectors: {
    '[aria-selected="true"] &': {fontWeight: themeVars.fontWeight.semibold},
  },
});

/** Wraps a theme mark; draws the selection ring around it. */
export const mark = style({
  position: 'relative',
  display: 'inline-flex',
  flex: 'none',
  borderRadius: '999px',
});

export const markRing = style({
  position: 'absolute',
  inset: '-5px',
  borderRadius: 'inherit',
  border: `2px solid ${themeVars.dynamicColors.primary}`,
  opacity: 0,
  transform: 'scale(0.92)',
  pointerEvents: 'none',
  transition: `opacity 200ms ease-out, transform 200ms ${strongEaseOut}`,
  selectors: {
    '[aria-selected="true"] &': {opacity: 1, transform: 'scale(1)'},
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {transition: 'none'},
  },
});

export const modeIcon = style({
  flex: 'none',
  color: themeVars.dynamicColors.descriptionTextColor,
});
