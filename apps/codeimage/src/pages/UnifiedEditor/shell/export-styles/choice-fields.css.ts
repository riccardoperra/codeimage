import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const hover = '(hover: hover) and (pointer: fine)';

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const label = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '8px',
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.medium,
  color: c.descriptionTextColor,
});

export const value = style({
  fontVariantNumeric: 'tabular-nums',
  fontWeight: themeVars.fontWeight.normal,
});

export const options = style({
  display: 'grid',
  gridAutoColumns: 'minmax(0, 1fr)',
  gridAutoFlow: 'column',
  gap: '6px',
  selectors: {
    '&[data-layout="cards"]': {
      gridAutoFlow: 'row',
      gridAutoColumns: 'auto',
    },
  },
});

export const option = style({position: 'relative', display: 'flex'});

// A choice on the surface, with no border. The selected one gets a ring.
export const optionLabel = style({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '40px',
  padding: '0 10px',
  borderRadius: '10px',
  background: c.input.backgroundColor,
  color: c.baseText,
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  cursor: 'pointer',
  userSelect: 'none',
  transition: `transform 160ms ${easeOut}, box-shadow 150ms ease-out`,
  selectors: {
    '&:active': {transform: 'scale(0.97)'},
    [`${option}[data-checked] &`]: {
      boxShadow: `inset 0 0 0 2px ${c.primary}`,
    },
    'input:focus-visible + &': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '2px',
    },
    [`${options}[data-layout="cards"] &`]: {
      justifyContent: 'flex-start',
      gap: '12px',
      minHeight: '56px',
      padding: '8px 12px',
      borderRadius: '12px',
    },
  },
  '@media': {
    [reducedMotion]: {
      selectors: {'&:active': {transform: 'none'}},
    },
  },
});

export const optionIcon = style({
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  color: c.descriptionTextColor,
  selectors: {
    [`${option}[data-checked] &`]: {color: c.primary},
  },
});

export const optionText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const optionHint = style({
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.normal,
  color: c.descriptionTextColor,
});

export const fixed = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: '40px',
  padding: '0 12px',
  borderRadius: '10px',
  background: c.input.backgroundColor,
  fontSize: themeVars.fontSize.sm,
  color: c.descriptionTextColor,
});

export const hint = style({
  margin: 0,
  fontSize: themeVars.fontSize.xs,
  color: c.descriptionTextColor,
});

/** A quiet text button, as for "Save as default". */
export const textButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  alignSelf: 'center',
  minHeight: '32px',
  padding: '0 10px',
  border: 0,
  borderRadius: '8px',
  background: 'transparent',
  color: c.descriptionTextColor,
  font: 'inherit',
  fontSize: themeVars.fontSize.sm,
  cursor: 'pointer',
  transition: `color 150ms ease-out, background-color 150ms ease-out, transform 160ms ${easeOut}`,
  selectors: {
    '&:active:not(:disabled)': {transform: 'scale(0.97)'},
    '&:disabled': {cursor: 'default'},
    '&:focus-visible': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '2px',
    },
  },
  '@media': {
    [hover]: {
      selectors: {
        '&:hover:not(:disabled)': {
          color: c.baseText,
          background: c.input.backgroundColor,
        },
      },
    },
  },
});
