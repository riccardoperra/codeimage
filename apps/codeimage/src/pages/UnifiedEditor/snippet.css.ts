import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

export const controls = style({
  selectors: {'&[data-editor-disabled]': {visibility: 'hidden'}},
});

// Descendants with their own visibility (theme cards, for example) stay hidden.
globalStyle(`${controls}[data-editor-disabled] *`, {visibility: 'hidden'});

export const notice = style({
  position: 'absolute',
  zIndex: 2,
  top: '12px',
  left: '12px',
  right: '12px',
  width: 'fit-content',
  maxWidth: 'calc(100% - 24px)',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['3'],
  padding: '8px 12px',
  borderRadius: '16px',
  background: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.panel.textColor,
  boxSizing: 'border-box',
});

globalStyle(`${notice} button`, {minHeight: '36px', flexShrink: 0});

export const canvas = style({position: 'relative'});
