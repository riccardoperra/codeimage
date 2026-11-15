import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const row = style({display: 'contents'});
export const trigger = style({
  width: '100%',
  minHeight: '36px',
  justifyContent: 'space-between',
  gap: '8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '@media': {'(max-width: 768px)': {minHeight: '40px'}},
});
export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  background: c.dialog.overlayBackgroundColor,
});
export const content = style({
  position: 'fixed',
  zIndex: 41,
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  width: 'min(360px, calc(100vw - 24px))',
  maxHeight: 'calc(100dvh - 32px)',
  padding: '16px',
  borderRadius: '20px',
  background: c.panel.background,
  color: c.baseText,
  boxShadow: '0 16px 64px #0004',
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  paddingBottom: '12px',
});
export const title = style({margin: 0, fontSize: '14px', fontWeight: 600});
export const body = style({
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});
globalStyle(`${content} *`, {boxSizing: 'border-box'});
globalStyle(`${body} [data-control] > div`, {
  minHeight: '40px',
  padding: '2px 0',
  alignItems: 'center',
  gridTemplateColumns: 'minmax(100px, 1fr) minmax(0, 1.5fr)',
});
globalStyle(`${body} [data-control] label`, {
  whiteSpace: 'nowrap',
  minHeight: '36px',
  height: 'auto',
  paddingLeft: 0,
  fontSize: '13px',
});
globalStyle(`${body} [data-control] > div > div`, {minWidth: 0});
