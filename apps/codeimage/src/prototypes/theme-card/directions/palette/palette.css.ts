import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {card} from '../../screen.css';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: themeVars.spacing['2'],
});

export const item = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: themeVars.spacing['2'],
  },
]);

export const swatch = style({
  borderRadius: '12px',
});

export const footer = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['1']}`,
});
