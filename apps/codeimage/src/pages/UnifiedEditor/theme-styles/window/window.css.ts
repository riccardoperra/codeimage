import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {card} from '../picker.css';

export const grid = style({
  display: 'grid',
  // Never fewer than two per row: a visible scrollbar takes about 15px from the
  // panel, which dropped a 148px minimum to one column.
  gridTemplateColumns: `repeat(auto-fill, minmax(min(148px, calc((100% - ${themeVars.spacing['2']}) / 2)), 1fr))`,
  gap: themeVars.spacing['2'],
});

export const item = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: themeVars.spacing['2'],
    padding: themeVars.spacing['2'],
  },
]);

export const swatch = style({
  display: 'flex',
  width: '100%',
  borderRadius: '13px',
});

export const footer = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['1']} ${themeVars.spacing['1']}`,
});
