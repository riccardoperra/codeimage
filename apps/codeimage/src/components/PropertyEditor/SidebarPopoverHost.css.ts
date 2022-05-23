import {style} from '@vanilla-extract/css';
import {scaffoldVars} from '../Scaffold/Scaffold.css';

export const wrapper = style({
  marginLeft: `calc(${scaffoldVars.panelWidth} + 10px)`,
  position: 'absolute',
  maxWidth: scaffoldVars.panelWidth,
  height: '0px',
  width: '0px',
  zIndex: 5,
});
