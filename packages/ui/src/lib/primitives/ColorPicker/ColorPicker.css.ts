import {style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';
import {backgroundColorVar, themeVars} from '../../theme';
import * as textFieldStyles from '../TextField/TextField.css';

export const wrapper = style({
  display: 'flex',
  width: '100%',
});

export const input = style([
  textFieldStyles.baseField,
  {
    padding: themeVars.spacing['1'],
    flex: 1,
  },
]);

export const inputColor = style({
  borderRadius: themeVars.borderRadius.md,
  width: themeVars.width.full,
  height: '100%',
  background: backgroundColorVar,
});

export const colorGrid = style({
  display: 'grid',
  gap: themeVars.spacing['3'],
  gridTemplateColumns: 'repeat(6, 1fr)',
});

export const colorItem = recipe({
  base: {
    borderRadius: themeVars.borderRadius.full,
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    background: backgroundColorVar,
    boxShadow: themeVars.boxShadow.md,
  },
  variants: {
    active: {
      true: {
        boxShadow: themeVars.boxShadow.outline,
      },
    },
  },
});

export type ColorPickerColorItemProps = RecipeVariants<typeof colorItem>;
