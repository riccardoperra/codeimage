import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../../../theme/dark-theme.css';

export const gridListItemCount = createVar();

export const gridList = style({
  vars: {
    [gridListItemCount]: '3',
  },
  display: 'grid',
  gap: themeVars.spacing['3'],
  width: '100%',
  height: `calc(128px + ${themeVars.spacing['3']})`,
  gridTemplateColumns: `repeat(${gridListItemCount}, minmax(0px, 1fr))`,
  gridAutoRows: '128px',
  '@media': {
    [`(max-width: 1280px)`]: {
      vars: {
        [gridListItemCount]: '2',
      },
    },
    [`(max-width: 768px)`]: {
      vars: {
        [gridListItemCount]: '1',
      },
    },
  },
});

export const gridListItemWrapper = style({
  height: `calc(128px + ${themeVars.spacing['3']})`,
  width: '100%',
});

export const fallbackContainer = style({
  minHeight: 0,
  flex: 1,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  color: themeVars.dynamicColors.descriptionTextColor,
  textAlign: 'center',
  borderRadius: themeVars.borderRadius.lg,
  selectors: {
    '[data-codeimage-theme=dark] &': {
      backgroundColor: darkGrayScale.gray3,
      color: themeVars.dynamicColors.descriptionTextColor,
    },
    '[data-codeimage-theme=light] &': {
      backgroundColor: themeVars.backgroundColor.gray['200'],
      color: themeVars.dynamicColors.descriptionTextColor,
    },
  },
});

export const fallbackTextTitle = style({
  color: themeVars.textColor.white,
});
