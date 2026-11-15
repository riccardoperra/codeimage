import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const phone = 'screen and (max-width: 768px)';

/** One island over the canvas for what is done to the image itself. */
export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  boxSizing: 'border-box',
  maxWidth: '100%',
  padding: '6px',
  borderRadius: '18px',
  background: c.panel.background,
  color: c.panel.textColor,
  pointerEvents: 'auto',
});

globalStyle(`${toolbar} button`, {
  minHeight: '36px',
  '@media': {[phone]: {minHeight: '40px'}},
});
