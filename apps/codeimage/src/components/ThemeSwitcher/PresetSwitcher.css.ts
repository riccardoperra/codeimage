import {themeVars, withThemeMode} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {recipe} from '@vanilla-extract/recipes';
import {gridSize} from './ThemeSwitcher.css';

export const grid = recipe({
  base: {
    display: 'grid',
    gap: themeVars.spacing['8'],
    paddingRight: themeVars.spacing['2'],
    height: '100%',
    gridAutoRows: 'min-content',
    overflow: 'auto',
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

export const item = style([
  {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    width: '100%',
    borderRadius: themeVars.borderRadius.xl,
    padding: themeVars.spacing['5'],
    boxShadow: themeVars.boxShadow.md,
    color: themeVars.dynamicColors.baseText,
    transition: 'background-color 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    selectors: {
      ...withThemeMode({
        dark: {
          backgroundColor: themeVars.dynamicColors.input.backgroundColor,
          border: `1px solid ${darkGrayScale.gray7}`,
        },
        light: {
          backgroundColor: themeVars.backgroundColor.white,
          border: `1px solid ${themeVars.borderColor.default}`,
          boxShadow: themeVars.boxShadow.default,
        },
      }),

      ...withThemeMode(
        {
          dark: {backgroundColor: darkGrayScale.gray2},
          light: {backgroundColor: darkGrayScale.gray12},
        },
        '&:hover',
      ),
    },
  },
]);

export const fixedTitle = style({
  position: 'sticky',
  top: 0,
  left: 0,
  backgroundColor: themeVars.dynamicColors.panel.background,
  zIndex: 10,
  paddingTop: themeVars.spacing['3'],
  marginBottom: themeVars.spacing['3'],
});

export const box = style({
  paddingTop: 0,
});
