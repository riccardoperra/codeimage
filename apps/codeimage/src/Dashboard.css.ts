import {
  adaptiveFullScreenHeight,
  dynamicFullHeight,
  textStyles,
  themeVars,
} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const title = style([
  textStyles.fontSize['3xl'],
  textStyles.fontWeight.medium,
  {
    marginBottom: themeVars.spacing['8'],
  },
]);

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    position: 'relative',
    width: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    color: themeVars.dynamicColors.panel.textColor,
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const main = style({
  marginTop: themeVars.spacing['12'],
});

export const gridList = style({
  display: 'grid',
  gap: themeVars.spacing['3'],
  gridTemplateColumns: 'repeat(3, minmax(0px, 1fr))',
  width: '100%',
});

export const item = style({
  backgroundColor: themeVars.dynamicColors.dialog.panelBackgroundColor,
  width: '100%',
  height: '180px',
  borderRadius: themeVars.borderRadius.sm,
  padding: '24px',
  boxShadow: themeVars.boxShadow.lg,
  color: themeVars.dynamicColors.descriptionTextColor,
  transition: 'background-color 0.2s ease-in-out',
  position: 'relative',
  ':hover': {
    backgroundColor: themeVars.dynamicColors.input.backgroundColor,
    color: themeVars.dynamicColors.baseText,
  },
});

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
