import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {createTheme, createVar, style} from '@vanilla-extract/css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [themeSwitcherTheme, themeSwitcherVars] = createTheme({});

export const gridSize = createVar();

export const grid = recipe({
  base: {
    display: 'grid',
    gap: themeVars.spacing['8'],
    padding: themeVars.spacing['4'],
    height: '100%',
    gridAutoRows: 'min-content',
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
  position: 'relative',

  selectors: {
    '&[data-selected="true"]': {
      boxShadow: themeVars.boxShadow.lg,
      outline: `2px solid ${themeVars.dynamicColors.primary}`,
      outlineOffset: '2px',
    },
  },
});

export const themeBoxContent = style({
  selectors: {
    [`${themeBox} &`]: {
      padding: themeVars.spacing['4'],
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
      backgroundColor: `rgba(0, 0, 0, .40)`,
      color: themeVars.backgroundColor.white,
      borderRadius: themeVars.borderRadius.lg,
      margin: themeVars.spacing['4'],
      marginTop: 0,
      userSelect: 'none',
    },
  },
});

export const themeBoxTerminalHost = style({
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['1']}`,
});

export const themeBoxSelectedOverlay = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  background: 'rgba(255,255,255,.3)',
  mixBlendMode: 'overlay',
  opacity: '0',
  transition: 'opacity 0.2s ease-in-out',
  top: 0,
  selectors: {
    [`${themeBox}:hover &`]: {
      opacity: 1,
    },
  },
});

export type ThemeSwitcherVariant = RecipeVariants<typeof grid>;
