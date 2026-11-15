import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import * as production from '../../../components/KeyboardShortcuts/KeyboardShortcuts.css';
export const host = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  pointerEvents: 'auto',
  borderRadius: '12px',
  background: themeVars.dynamicColors.panel.background,
});
globalStyle(`${host} button`, {
  minHeight: '36px',
  minWidth: '36px',
  fontSize: 0,
  padding: '8px',
  '@media': {'(max-width: 768px)': {minHeight: '40px', minWidth: '40px'}},
});
const panel = `body:has(${host}) div:has(> .${production.list})`;
globalStyle(panel, {
  position: 'fixed',
  left: '50% !important',
  top: '50% !important',
  transform: 'translate(-50%, -50%)',
  maxHeight: 'calc(100dvh - 32px)',
  width: 'min(620px, calc(100vw - 24px))',
  overflowY: 'auto',
  zIndex: 110,
  background: themeVars.dynamicColors.panel.background,
  borderRadius: '20px',
});
globalStyle(`body:has(${host}) .${production.overlay}`, {zIndex: 109});
globalStyle(`body:has(${host}) .${production.list}`, {
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0 16px',
  padding: '16px',
  gridAutoRows: 'minmax(40px, auto)',
});
globalStyle(`body:has(${host}) .${production.keyList}`, {marginLeft: 0});

export const mount = style({display: 'contents'});
globalStyle(`${mount} button`, {display: 'none'});
