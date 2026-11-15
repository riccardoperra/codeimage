import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

export const cluster = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

// Space, not a line, between Format code and the export cluster.
export const gap = style({width: '8px', flex: 'none'});

export const picker = style({
  gap: '6px',
  fontVariantNumeric: 'tabular-nums',
});

export const chevron = style({
  color: c.descriptionTextColor,
});

export const menu = style({
  width: '320px',
  maxWidth: 'calc(100vw - 16px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const pickerMenu = style({
  width: '304px',
  maxWidth: 'calc(100vw - 16px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const check = style({
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  width: '18px',
  marginLeft: 'auto',
  color: c.primary,
});

export const scaleRow = style({
  selectors: {'&&': {minHeight: '40px', padding: '6px 12px'}},
});

export const scaleValue = style({
  minWidth: '28px',
  fontWeight: themeVars.fontWeight.medium,
});
