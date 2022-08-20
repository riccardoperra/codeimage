import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../../../theme/dark-theme.css';

export const gridList = style({
  display: 'grid',
  gap: themeVars.spacing['3'],
  width: '100%',
  marginBottom: themeVars.spacing['12'],
  gridTemplateColumns: 'repeat(2, minmax(0px, 1fr))',
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
  gap: themeVars.spacing['2'],
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
