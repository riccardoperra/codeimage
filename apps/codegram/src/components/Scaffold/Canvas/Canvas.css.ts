import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {scaffoldVars} from '../Scaffold.css';

export const canvas = style({
  position: 'absolute',
  top: scaffoldVars.toolbarHeight,
  right: scaffoldVars.panelWidth,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  left: 0,
  backgroundColor: themeVars.backgroundColor.gray['100'],
});
