import {textFieldStyles, themeVars} from '@codeimage/ui';
import {responsiveStyle} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const input = style([
  textFieldStyles.baseField,
  {
    padding: themeVars.spacing['1'],
    paddingLeft: themeVars.spacing['3'],
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
  },
]);

export const fontPickerPopover = style([
  {
    width: '360px',
    maxWidth: '360px',
  },
  responsiveStyle({
    md: {
      maxWidth: 'initial',
    },
  }),
]);

export const aspectRatioCardDetails = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});
