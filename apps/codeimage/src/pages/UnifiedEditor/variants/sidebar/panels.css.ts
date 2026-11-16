import {panelRow} from '../../../../components/PropertyEditor/EditorSidebar.css';
import {globalStyle, style} from '@vanilla-extract/css';

// The body of a panel, the same in the accordion and beside the rail.

export const panelBody = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '0 16px 16px 0',
});

globalStyle(`${panelBody} ${panelRow}`, {
  minHeight: '40px',
  paddingTop: '2px',
  paddingBottom: '2px',
  alignItems: 'center',
  '@media': {'(max-width: 768px)': {paddingTop: 0, paddingBottom: 0}},
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  selectors: {'& + &': {marginTop: '8px'}},
});

// Themes

export const themeBody = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '0 16px',
});

export const presetsHost = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '4px 12px 12px 16px',
  overflow: 'hidden',
});

// The kit's Select list, which renders in a portal.
export const selectPortal = style({
  animation: 'none !important',
  transition: 'none !important',
  maxWidth: 'var(--kb-popper-anchor-width)',
  fontSize: '13px',
});

globalStyle(`${selectPortal} [role='option']`, {
  minHeight: '40px',
  fontSize: '13px',
});
