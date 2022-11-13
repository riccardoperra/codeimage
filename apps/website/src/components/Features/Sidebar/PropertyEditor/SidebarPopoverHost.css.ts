import {createTheme, style} from '@vanilla-extract/css';

export const [scaffoldTheme, scaffoldVars] = createTheme({
  toolbarHeight: '56px',
  panelWidth: '320px',
  virtualHeightFallback: '1vh',
});

export const wrapper = style({
  marginLeft: `calc(${scaffoldVars.panelWidth} + 10px)`,
  position: 'absolute',
  maxWidth: scaffoldVars.panelWidth,
  height: '0px',
  width: '0px',
  zIndex: 5,
});
