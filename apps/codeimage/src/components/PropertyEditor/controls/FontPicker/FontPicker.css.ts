import {textFieldStyles, themeVars} from '@codeimage/ui';
import {responsiveStyle, themeTokens} from '@codeui/kit';
import {createVar, style} from '@vanilla-extract/css';

export const input = style([
  textFieldStyles.baseField,
  {
    paddingLeft: themeVars.spacing['3'],
    paddingRight: themeVars.spacing['3'],
    flex: 1,
    justifyContent: 'space-between',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing['3'],
  },
]);

export const inputValue = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

export const inputIcon = style({
  flexShrink: 0,
});

export const fontListboxHeight = createVar();

export const fontPickerPopover = style([
  {
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

export const experimentalFlag = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});

export const centeredContent = style({
  width: '100%',
  height: fontListboxHeight,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
});

export const virtualizedFontListboxWrapper = style({
  height: fontListboxHeight,
});

export const virtualizedFontListbox = style({
  maxHeight: fontListboxHeight,
  overflow: 'auto',
  height: '100%',
});

export const virtualizedFontListboxSearch = style({
  flex: 1,
});

export const virtualizedFontListboxToolbar = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: themeTokens.spacing['2'],
  ':first-child': {
    flex: 1,
  },
});
