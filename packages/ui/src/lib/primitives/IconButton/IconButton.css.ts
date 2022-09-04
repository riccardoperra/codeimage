import {style} from '@vanilla-extract/css';
import {buttonHeight as btnSize} from '../Button/Button.css';

export const iconButton = style({
  width: btnSize,
  height: btnSize,
  padding: 0,
  textAlign: 'center',
  minWidth: btnSize,
  maxWidth: btnSize,
});
