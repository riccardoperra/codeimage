import {keyframes, style, styleVariants} from '@vanilla-extract/css';

export const duration = 250;

export const interactive = style({
  selectors: {
    '&[data-expanded]': {pointerEvents: 'auto'},
    '&[data-closed]': {pointerEvents: 'none'},
  },
});

const panelOpen = keyframes({
  from: {opacity: 0, transform: 'scale(.95) translateY(10px)'},
  to: {opacity: 1, transform: 'scale(1) translateY(0)'},
});
const panelClose = keyframes({
  from: {opacity: 1, transform: 'scale(1) translateY(0)'},
  to: {opacity: 0, transform: 'scale(.95) translateY(10px)'},
});

export const positioner = style({
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: '0.5rem',
  backgroundColor: 'rgba(0,0,0,.7)',
  pointerEvents: 'auto',
  selectors: {
    '[data-cui-theme=light] &': {backgroundColor: '#091e427d'},
    '&[data-panel-size=full]': {paddingBlock: 0},
    '&[data-nonmodal]': {backgroundColor: 'transparent', pointerEvents: 'none'},
    '&[data-closed]': {pointerEvents: 'none'},
  },
});

const panelBase = style({
  display: 'inline-flex',
  flexDirection: 'column',
  width: '100%',
  maxHeight: '100%',
  maxWidth: '100%',
  padding: 0,
  overflow: 'hidden',
  textAlign: 'left',
  alignItems: 'stretch',
  color: '#fff',
  boxShadow: '0 1px #0000000d,0 4px 10px rgba(0,0,0,.3)',
  borderRadius: '14px',
  backgroundColor: '#1d1d1d',
  transform: 'translate(0,0)',
  outline: 'none',
  selectors: {
    '[data-cui-theme=light] &': {
      color: '#000',
      backgroundColor: '#fff',
      boxShadow: '0 1px #0000000d,0 4px 10px rgba(0,0,0,.1)',
    },
    '&[data-expanded]': {
      animation: `${panelOpen} ${duration}ms ease-in-out`,
      pointerEvents: 'auto',
    },
    '&[data-closed]': {
      animation: `${panelClose} ${duration}ms ease-in-out both`,
      pointerEvents: 'none',
    },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      selectors: {
        '&[data-expanded], &[data-closed]': {animationDuration: '0ms'},
      },
    },
  },
});

export const panel = styleVariants({
  xs: [panelBase, {width: '24rem'}],
  sm: [panelBase, {width: '28rem'}],
  md: [panelBase, {width: '32rem'}],
  lg: [
    panelBase,
    {'@media': {'screen and (min-width: 768px)': {width: '48rem'}}},
  ],
  xl: [
    panelBase,
    {
      '@media': {
        'screen and (min-width: 768px)': {width: '48rem'},
        'screen and (min-width: 1024px)': {width: '64rem'},
      },
    },
  ],
  full: [
    panelBase,
    {width: '100%', height: '100%', minHeight: '100%', borderRadius: 0},
  ],
});

export const titleRow = style({
  height: '56px',
  borderBottom: '1px solid #3e3e3e',
  paddingInline: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  fontSize: '1.25rem',
  fontWeight: 500,
  selectors: {
    '[data-cui-theme=light] &': {borderBottomColor: 'hsl(0,0%,90.9%)'},
  },
});

export const panelContent = style({
  padding: '1.5rem',
  overflow: 'auto',
  selectors: {'[data-panel-size=full] &': {flex: 1}},
});

export const panelFooter = style({
  padding: '1.5rem',
  selectors: {
    '[data-panel-size=full] &': {
      marginTop: 'auto',
      marginBottom: 'env(safe-area-inset-bottom, 20px)',
    },
  },
});

const closeBase = style({
  display: 'inline-grid',
  placeItems: 'center',
  flexShrink: 0,
  cursor: 'pointer',
  padding: 0,
  color: 'inherit',
  border: '1px solid transparent',
  font: 'inherit',
  backgroundColor: '#333',
  selectors: {
    '[data-cui-theme=light] &': {backgroundColor: '#eee'},
    '&:hover': {filter: 'brightness(1.13)'},
    '&:focus-visible': {
      outline: '2px solid currentColor',
      outlineOffset: '2px',
    },
    '&:disabled': {cursor: 'default', opacity: 0.5},
  },
});

export const ghost = style({
  backgroundColor: 'transparent',
  selectors: {
    '[data-cui-theme=light] &': {backgroundColor: 'transparent'},
    '&:hover': {
      backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
    },
  },
});

export const close = styleVariants({
  xs: [closeBase, {width: '30px', height: '30px', borderRadius: '7px'}],
  sm: [closeBase, {width: '36px', height: '36px', borderRadius: '9px'}],
  md: [closeBase, {width: '40px', height: '40px', borderRadius: '12px'}],
});

export const closeIcon = style({width: '16px', height: '16px'});
