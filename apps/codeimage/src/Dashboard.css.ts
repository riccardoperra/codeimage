import {
  adaptiveFullScreenHeight,
  backgroundColorVar,
  textStyles,
  themeVars,
} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {darkGrayScale} from './theme/dark-theme.css';

export const title = style([
  textStyles.fontSize['2xl'],
  textStyles.fontWeight.medium,
]);

export const scaffold = style([
  adaptiveFullScreenHeight,
  {
    color: themeVars.dynamicColors.panel.textColor,
    background: themeVars.dynamicColors.background,
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const wrapper = style([
  {
    position: 'relative',
    width: '1280px',
    height: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    color: themeVars.dynamicColors.panel.textColor,
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const main = style({
  marginTop: themeVars.spacing['12'],
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

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

export const item = style({
  backgroundColor: themeVars.dynamicColors.input.backgroundColor,
  width: '100%',
  borderRadius: themeVars.borderRadius.sm,
  padding: '24px',
  boxShadow: themeVars.dynamicColors.dialog.panelShadow,
  color: themeVars.dynamicColors.descriptionTextColor,
  transition: 'background-color 0.2s ease-in-out',
  position: 'relative',
  ':hover': {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    color: themeVars.dynamicColors.baseText,
  },
  selectors: {
    '[data-displayMode="grid"] &': {
      height: '128px',
    },
    '[data-displayMode="list"] &': {
      height: '64px',
    },
  },
});

export const itemSkeleton = style([
  item,
  {
    selectors: {
      '[data-codeimage-theme=light] &': {
        vars: {
          [backgroundColorVar]: themeVars.backgroundColor.gray['100'],
        },
      },
      '[data-codeimage-theme=dark] &': {
        vars: {
          [backgroundColorVar]: darkGrayScale.gray2,
        },
      },
    },
  },
]);

export const itemLink = style({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  outline: 'none',
});

export const itemTitle = style({
  display: 'flex',
  alignItems: 'center',
  columnGap: themeVars.spacing['2'],
});
