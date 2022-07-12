import {themeVars} from '@codeimage/ui';
import {recipe} from '@vanilla-extract/recipes';

export const gridList = recipe({
  base: {
    display: 'grid',
    gap: themeVars.spacing['3'],
    gridTemplateColumns: 'repeat(3, minmax(0px, 1fr))',
    width: '100%',
    marginBottom: themeVars.spacing['12'],
    overflow: 'auto',
    minHeight: '0',
  },
  variants: {
    displayMode: {
      grid: {
        gridTemplateColumns: 'repeat(3, minmax(0px, 1fr))',
      },
      list: {
        gridTemplateColumns: 'repeat(1, minmax(0px, 1fr))',
      },
    },
  },
});
