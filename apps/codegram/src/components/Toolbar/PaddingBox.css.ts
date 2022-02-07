import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {recipe} from '@vanilla-extract/recipes';

export const [padding, paddingVar] = createTheme({});

export const container = style([
  padding,
  {
    fontSize: themeVars.fontSize.sm,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    rowGap: '4px',
  },
]);

export const itemContainer = style({
  display: 'flex',
  columnGap: '8px',
  fontWeight: themeVars.fontWeight.semibold,
});

export const item = recipe({
  base: {
    color: themeVars.textColor.black,
    cursor: 'pointer',
    borderRadius: themeVars.borderRadius.lg,
    padding: themeVars.spacing['1'],
    transition: 'background-color .2s, color .2s',
    userSelect: 'none',
    ':hover': {
      backgroundColor: themeVars.backgroundColor.indigo['200'],
      color: themeVars.textColor.indigo['700'],
    },
  },
  variants: {
    active: {
      true: {
        backgroundColor: themeVars.backgroundColor.indigo['200'],
        color: themeVars.textColor.indigo['700'],
      },
    },
  },
});
