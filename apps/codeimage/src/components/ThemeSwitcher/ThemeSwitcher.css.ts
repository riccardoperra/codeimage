import {createTheme, createVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {backgroundColorVar} from '../../theme/variables.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [themeSwitcherTheme, themeSwitcherVars] = createTheme({});

export const gridSize = createVar();

export const grid = recipe({
  base: {
    display: 'grid',
    gap: '40px',
    padding: themeVars.spacing['4'],
    overflowY: 'auto',
    height: '100%',
    gridAutoRows: 'min-content',

    '::-webkit-scrollbar': {
      width: '20px',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: themeVars.backgroundColor.gray['400'],
      borderRadius: themeVars.borderRadius.full,
      border: '6px solid transparent',
      backgroundClip: 'content-box',
      transition: 'background-color .2s',
    },

    selectors: {
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: themeVars.backgroundColor.gray['500'],
      },
    },
  },
  variants: {
    orientation: {
      horizontal: {
        gridTemplateColumns: `repeat(${gridSize}, 80%)`,
        scrollSnapType: 'x mandatory',
        overflowX: 'scroll',
        overflowY: 'hidden',
      },
      vertical: {
        gridTemplateColumns: '1fr',
      },
    },
  },
});

export const themeBox = style({
  width: '100%',
  borderRadius: themeVars.borderRadius.xl,
  background: backgroundColorVar,
  overflow: 'hidden',
  cursor: 'pointer',
});

export const themeBoxContent = style({
  selectors: {
    [`${themeBox} &`]: {
      padding: themeVars.spacing['3'],
    },
  },
});

export const themeBoxFooter = style({
  selectors: {
    [`${themeBox} &`]: {
      display: 'flex',
      padding: themeVars.spacing['3'],
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: `rgba(0, 0, 0, .25)`,
      color: themeVars.backgroundColor.white,
    },
  },
});

export type ThemeSwitcherVariant = RecipeVariants<typeof grid>;
