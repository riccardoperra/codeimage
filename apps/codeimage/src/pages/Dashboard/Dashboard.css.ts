import {adaptiveFullScreenHeight, textStyles, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

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
  height: '100%',
  minHeight: '0',
  marginLeft: 'auto',
  marginRight: 'auto',
  flexDirection: 'column',
});

export const scrollableList = style({
  flex: 1,
  overflow: 'auto',
  minHeight: '0',
  height: '100%',
});
