import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {card} from '../../screen.css';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeVars.spacing['3'],
});

export const item = style([
  card,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: themeVars.spacing['3'],
    width: '100%',
  },
]);

export const preview = style({
  borderRadius: '12px',
  padding: themeVars.spacing['3'],
  pointerEvents: 'none',
});

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['1']}`,
});

// Today's preview is 11px text in a window that hugs it; here it fills the
// card and the code is large enough to read.
globalStyle(`${preview} > div`, {width: '100%'});
globalStyle(`${preview} .cm-editor`, {fontSize: '13px'});
