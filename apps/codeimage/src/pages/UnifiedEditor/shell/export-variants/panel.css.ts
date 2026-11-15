import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

export const panel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '344px',
  maxWidth: 'calc(100vw - 16px)',
  maxHeight: 'var(--kb-popper-content-available-height)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  selectors: {'&&': {padding: '16px 12px 8px'}},
});

export const choose = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '0 4px',
});

export const head = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '8px',
});

export const title = style({
  margin: 0,
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
});

export const caption = style({
  fontSize: themeVars.fontSize.xs,
  color: c.descriptionTextColor,
});

export const commit = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

export const actions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingTop: '8px',
});

// The kit's block button grows along the column instead of across it.
export const download = style({width: '100%'});
