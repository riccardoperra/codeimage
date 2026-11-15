import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {card} from '../picker.css';

export const grid = style({
  display: 'grid',
  // Three columns in a narrow panel, cards of at least 136px where there is room.
  gridTemplateColumns: `repeat(auto-fill, minmax(min(136px, calc((100% - 16px) / 3)), 1fr))`,
  gap: themeVars.spacing['2'],
});

export const item = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: `10px ${themeVars.spacing['3']}`,
    textAlign: 'center',
  },
]);

export const badge = style({
  position: 'absolute',
  right: '-4px',
  bottom: '-4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: themeVars.dynamicColors.background,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
});
