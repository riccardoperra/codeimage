import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {scaffoldVars} from '../Scaffold.css';

export const canvas = style({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1 auto',
  position: 'relative',
  backgroundColor: themeVars.backgroundColor.gray['100'],
});
