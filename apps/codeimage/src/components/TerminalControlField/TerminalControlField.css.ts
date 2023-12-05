import {textFieldStyles, themeVars} from '@codeimage/ui';
import {responsiveStyle, themeTokens} from '@codeui/kit';
import {createVar, style} from '@vanilla-extract/css';

export const input = style([
  textFieldStyles.baseField,
  {
    paddingLeft: themeVars.spacing['2'],
    paddingRight: themeVars.spacing['2'],
    flex: 1,
    justifyContent: 'space-between',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
  },
]);

export const inputIcon = style({
  flexShrink: 0,
});

export const fontListboxHeight = createVar();

export const fontPickerPopover = style([
  {
    width: '360px',
    maxWidth: '360px',
    // TODO: popover class is not recognized
    display: 'flex',
    flexDirection: 'column',
    gap: themeTokens.spacing['3'],
    vars: {
      [fontListboxHeight]: '350px',
    },
  },
  responsiveStyle({
    md: {
      maxWidth: 'initial',
    },
  }),
]);
