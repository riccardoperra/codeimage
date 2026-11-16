import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const phone = 'screen and (max-width: 768px)';

/** Where the prompt bar opens, over the toolbar. */
export const anchor = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '100%',
  minWidth: 0,
});

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
  selectors: {'&[data-covered]': {visibility: 'hidden'}},
});

globalStyle(`${toolbar} button`, {
  minHeight: '36px',
  '@media': {[phone]: {minHeight: '40px'}},
});
