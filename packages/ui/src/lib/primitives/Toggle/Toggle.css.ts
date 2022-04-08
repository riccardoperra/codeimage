import {createVar, style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {themeVars} from '../../theme';

const toggleHeight = createVar();
const toggleWidth = createVar();
const toggleMargin = createVar();

export const toggle = style([
  {
    vars: {
      [toggleHeight]: '25px',
      [toggleWidth]: '55px',
      [toggleMargin]: '5px',
    },
  },
  {
    height: toggleHeight,
    position: 'relative',
    overflow: 'hidden',
    appearance: 'none',
    outline: 'none',
    border: 'none',
    width: toggleWidth,
    cursor: 'pointer',
    borderRadius: themeVars.borderRadius.full,
    transition: 'background-color .2s',
    backgroundColor: themeVars.backgroundColor.indigo['300'],
    selectors: {
      '&[data-sh-pressed="true"]': {
        backgroundColor: themeVars.backgroundColor.indigo['500'],
      },

      '&[data-sh-pressed="true"]&::before': {
        transform: `translateX(calc(${toggleWidth} / 2))`,
      },
    },
    '::before': {
      position: 'absolute',
      content: '',
      borderRadius: themeVars.borderRadius.full,
      left: toggleMargin,
      top: toggleMargin,
      backgroundColor: 'white',
      width: `calc(${toggleHeight} - calc(${toggleMargin} * 2))`,
      height: `calc(${toggleHeight} - calc(${toggleMargin} * 2))`,
      transition: '.2s',
    },
  },
]);

export const circle = style({
  position: 'absolute',
  borderRadius: themeVars.borderRadius.full,
  backgroundColor: 'white',
  top: `calc(${toggleHeight} / 2)`,
  transform: 'translateY(-50%) translateX(-0.5rem)',
  left: '1rem',
  width: 16,
  height: 16,
  selectors: {
    [`${toggle} &[data-sh-pressed="true"]`]: {},
  },
});

export const variant = recipe({
  base: [toggle],
});

export type ToggleVariants = RecipeVariants<typeof variant>;
