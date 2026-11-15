import {themeVars} from '@codeimage/ui';
import {keyframes, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const hover = '(hover: hover) and (pointer: fine)';

const surfaceIn = keyframes({
  from: {opacity: 0, transform: 'scale(0.96)'},
  to: {opacity: 1, transform: 'scale(1)'},
});
const surfaceOut = keyframes({
  from: {opacity: 1, transform: 'scale(1)'},
  to: {opacity: 0, transform: 'scale(0.98)'},
});
const fadeIn = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const fadeOut = keyframes({from: {opacity: 1}, to: {opacity: 0}});

/**
 * A popover or menu of export: it grows from its trigger and leaves faster
 * than it came. Opened from the keyboard (`data-instant`), it appears at once.
 * Doubled, to win over the kit's own menu surface.
 */
export const surface = style({
  selectors: {
    '&&': {
      boxSizing: 'border-box',
      padding: '8px',
      border: 'none',
      borderRadius: '18px',
      background: c.dialog.panelBackgroundColor,
      boxShadow: c.dialog.panelShadow,
      color: c.baseText,
      outline: 'none',
      zIndex: 40,
      transformOrigin:
        'var(--kb-popover-content-transform-origin, var(--kb-menu-content-transform-origin))',
      animation: `${surfaceOut} 120ms ${easeOut}`,
    },
    '&&[data-expanded]': {animation: `${surfaceIn} 180ms ${easeOut}`},
    '&&[data-instant]': {animation: 'none'},
  },
  '@media': {
    [reducedMotion]: {
      selectors: {
        '&&': {animation: `${fadeOut} 120ms ease`},
        '&&[data-expanded]': {animation: `${fadeIn} 160ms ease`},
        '&&[data-instant]': {animation: 'none'},
      },
    },
  },
});

/** A row of the export actions: an icon on a tile, a title, one line. */
export const actionRow = style({
  selectors: {
    '&&': {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '52px',
      margin: 0,
      padding: '8px',
      border: 0,
      borderRadius: '12px',
      background: 'transparent',
      color: c.baseText,
      font: 'inherit',
      textAlign: 'left',
      cursor: 'pointer',
      outline: 'none',
      transition: `background-color 150ms ease-out, transform 160ms ${easeOut}`,
    },
    '&&:active:not(:disabled):not([data-disabled])': {
      transform: 'scale(0.97)',
    },
    '&&[data-highlighted], &&:focus-visible': {
      background: c.input.backgroundColor,
    },
    '&&:disabled, &&[data-disabled]': {opacity: 0.45, cursor: 'default'},
  },
  '@media': {
    [hover]: {
      selectors: {
        '&&:hover:not(:disabled):not([data-disabled])': {
          background: c.input.backgroundColor,
        },
      },
    },
  },
});

export const actionTile = style({
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: c.input.backgroundColor,
  color: c.baseText,
});

export const actionText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
});

export const actionTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.medium,
  lineHeight: 1.3,
});

export const actionDescription = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.3,
  color: c.descriptionTextColor,
});

// One control in two parts: space between them, no border.
export const group = style({
  display: 'inline-flex',
  alignItems: 'stretch',
  gap: '2px',
  flex: 'none',
});

export const main = style({
  borderTopRightRadius: '4px',
  borderBottomRightRadius: '4px',
});

export const more = style({
  borderTopLeftRadius: '4px',
  borderBottomLeftRadius: '4px',
});

export const item = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
});

export const hint = style({
  color: c.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.normal,
});

export const warning = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: themeVars.spacing['3'],
});

export const confirmActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: themeVars.spacing['2'],
});

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: c.dialog.overlayBackgroundColor,
});
export const confirmation = style({
  position: 'fixed',
  inset: 0,
  zIndex: 101,
  display: 'grid',
  placeItems: 'center',
  padding: themeVars.spacing['4'],
  pointerEvents: 'none',
});

export const confirmationPanel = style({
  width: 'min(448px, 100%)',
  pointerEvents: 'auto',
  padding: themeVars.spacing['4'],
  borderRadius: themeVars.borderRadius.xl,
  background: c.panel.background,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
});
