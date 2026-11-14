import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {option} from '../picker.css';

// One column in a panel; rows flow into columns in a wide tray.
export const group = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  columnGap: themeVars.spacing['3'],
  rowGap: '2px',
  selectors: {
    '& + &': {marginTop: themeVars.spacing['4']},
  },
});

export const groupLabel = style({
  gridColumn: '1 / -1',
  padding: `0 ${themeVars.spacing['2']} ${themeVars.spacing['1']}`,
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  fontWeight: themeVars.fontWeight.medium,
});

export const row = style([
  option,
  {
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
    width: '100%',
    height: '40px',
    padding: `0 ${themeVars.spacing['2']}`,
    borderRadius: '10px',
    selectors: {
      '&[aria-pressed="true"]': {
        background: themeVars.dynamicColors.input.backgroundColor,
      },
      ...withThemeMode(
        {light: {background: themeVars.backgroundColor.white}},
        '&[aria-pressed="true"]',
      ),
    },
  },
]);

export const label = style({flex: 1});

export const check = style({
  flex: 'none',
  color: themeVars.dynamicColors.primary,
  opacity: 0,
  transform: 'scale(0.8)',
  transition:
    'opacity 150ms ease-out, transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
  selectors: {
    '[aria-pressed="true"] &': {opacity: 1, transform: 'scale(1)'},
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': {transition: 'none'},
  },
});
