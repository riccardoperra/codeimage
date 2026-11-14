import {style} from '@vanilla-extract/css';
import {windowVars as palette} from '../windowPalette.css';

export const mono = 'var(--codeimage-window-font, "JetBrains Mono", monospace)';
export const theme = style({});
export const body = style({display: 'flex', flexDirection: 'column'});
export const bar = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  flex: 'none',
  color: palette.ink62,
  fontSize: '12.5px',
  letterSpacing: '.01em',
  fontFamily: mono,
  selectors: {
    '&[data-style=card]': {
      height: '44px',
      padding: '0 20px',
      justifyContent: 'space-between',
    },
    '&[data-style=editor]': {
      height: '40px',
      alignItems: 'stretch',
      background: palette.ink04,
      boxShadow: `inset 0 -1px 0 ${palette.ink08}`,
    },
    '&[data-style=shell]': {
      height: '38px',
      justifyContent: 'center',
      background: palette.ink04,
      boxShadow: `inset 0 -1px 0 ${palette.ink08}`,
    },
  },
});
export const language = style({
  fontSize: '10.5px',
  letterSpacing: '.09em',
  textTransform: 'uppercase',
  color: palette.ink45,
  flexShrink: 0,
  marginLeft: 'auto',
});
export const mark = style({
  width: '8px',
  height: '8px',
  borderRadius: '2px',
  background: palette.accent,
  flexShrink: 0,
});
export const dots = style({
  position: 'absolute',
  left: '14px',
  display: 'flex',
  gap: '7px',
});
export const dot = style({
  width: '11px',
  height: '11px',
  borderRadius: '50%',
  background: palette.ink20,
});
export const breadcrumb = style({
  display: 'flex',
  alignItems: 'center',
  height: '30px',
  gap: '6px',
  padding: '0 16px',
  fontSize: '11.5px',
  color: palette.ink45,
});
export const leaf = style({color: palette.ink78});
export const prompt = style({
  display: 'flex',
  gap: '8px',
  padding: '14px 16px 0',
  fontFamily: mono,
  fontSize: '13px',
  color: palette.ink62,
});
// A drawn chevron, not the "❯" character: the Node renderer's fonts lack that
// glyph and draw a box in its place.
export const promptSign = style({
  width: '6px',
  height: '6px',
  flex: 'none',
  alignSelf: 'center',
  marginLeft: '-2px',
  borderTop: `1.5px solid ${palette.accent}`,
  borderRight: `1.5px solid ${palette.accent}`,
  transform: 'rotate(45deg)',
});
export const status = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '26px',
  gap: '14px',
  padding: '0 12px',
  fontSize: '11px',
  color: palette.ink78,
  background: palette.status,
  boxShadow: `inset 0 1px 0 ${palette.ink08}`,
});
export const statusLanguage = style({
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  color: palette.ink90,
});

export const codeBody = style({position: 'relative'});
