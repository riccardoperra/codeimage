import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {card} from '../picker.css';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(136px, 1fr))',
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
  display: 'flex',
  width: '100%',
  borderRadius: '12px',
});

export const footer = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['1']}`,
});
