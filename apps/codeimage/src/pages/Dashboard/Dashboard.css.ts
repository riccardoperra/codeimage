import {adaptiveFullScreenHeight, textStyles, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

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
    height: '100%',
    width: '100%',
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
  width: '1280px',
  marginLeft: 'auto',
  marginRight: 'auto',
  flexDirection: 'column',
});
