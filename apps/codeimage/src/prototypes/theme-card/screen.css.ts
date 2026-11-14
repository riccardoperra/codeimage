import {themeVars, withThemeMode} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

export const islandWidth = createVar();

const strongEaseOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
});

export const body = style({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['2']} ${themeVars.spacing['2']}`,
});

const island = style({
  borderRadius: '22px',
  background: themeVars.dynamicColors.background,
});

export const canvasIsland = style([
  island,
  {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
]);

export const themeIsland = style([
  island,
  {
    display: 'flex',
    flexDirection: 'column',
    flex: 'none',
    gap: themeVars.spacing['3'],
    width: islandWidth,
    minHeight: 0,
    padding: `${themeVars.spacing['4']} ${themeVars.spacing['4']} 0`,
  },
]);

export const islandHeader = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
});

export const islandTitle = style({
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
});

export const muted = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.sm,
});

export const filter = style({flex: 'none'});

export const list = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  margin: `0 calc(${themeVars.spacing['4']} * -1)`,
  padding: `${themeVars.spacing['1']} ${themeVars.spacing['4']} ${themeVars.spacing['4']}`,
  scrollbarWidth: 'thin',
});

export const empty = style([muted, {padding: `${themeVars.spacing['6']} 0`}]);

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
    '[aria-pressed="true"] &': {fontWeight: themeVars.fontWeight.semibold},
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
    '[aria-pressed="true"] &': {opacity: 1, transform: 'scale(1)'},
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {transition: 'none'},
  },
});

export const modeIcon = style({
  flex: 'none',
  color: themeVars.dynamicColors.descriptionTextColor,
});
