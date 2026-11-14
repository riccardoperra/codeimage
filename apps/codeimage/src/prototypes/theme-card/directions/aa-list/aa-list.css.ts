import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {option} from '../../screen.css';

export const group = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  selectors: {
    '& + &': {marginTop: themeVars.spacing['4']},
  },
});

export const groupLabel = style({
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
