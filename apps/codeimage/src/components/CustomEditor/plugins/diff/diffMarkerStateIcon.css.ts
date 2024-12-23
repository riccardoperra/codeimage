import {backgroundColorVar} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style({
  height: '100%',
});

export const icon = style({
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: '4px',
  backgroundColor: backgroundColorVar,
});
