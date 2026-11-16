import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const island = style({
  width: 'calc(100% - 24px)',
  maxWidth: 1100,
  minWidth: 0,
  margin: '0 auto 12px',
  boxSizing: 'border-box',
  flexShrink: 0,
  padding: '12px 16px',
  borderRadius: themeVars.borderRadius.xl,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  display: 'grid',
  gap: 10,
  fontSize: themeVars.fontSize.sm,
  '@media': {
    '(max-width: 768px)': {padding: 12, width: 'calc(100% - 16px)', gap: 8},
  },
});
globalStyle(
  `${island} [data-cui="button"], ${island} [data-cui="icon-button"], ${island} [aria-haspopup="listbox"]`,
  {
    '@media': {'(max-width: 768px)': {minHeight: 40, minWidth: 40}},
  },
);
export const transport = style({
  minWidth: 0,
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  minHeight: 36,
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
export const time = style({
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '19ch',
  fontSize: 12,
  '@media': {'(max-width: 768px)': {minWidth: 0, flex: 1}},
});
export const barTime = style({
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '15ch',
  padding: '0 4px',
  fontSize: 12,
});
export const spacer = style({
  flex: 1,
  '@media': {'(max-width: 768px)': {display: 'none'}},
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});
export const title = style({width: 160, minWidth: 0});
export const desktopHeader = style({
  '@media': {'(max-width: 768px)': {display: 'none'}},
});
export const mobileHeader = style({
  display: 'none',
  '@media': {'(max-width: 768px)': {display: 'block'}},
});
export const details = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  minHeight: 36,
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
export const field = style([
  {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  {
    selectors: {
      '[data-transition-popover] &': {justifyContent: 'space-between'},
    },
  },
]);
export const number = style([
  {
    position: 'relative',
    width: 110,
    '@media': {'(max-width: 768px)': {width: 142}},
  },
  {
    selectors: {
      '[data-step-toolbar] &': {
        width: 150,
        '@media': {'(max-width: 768px)': {width: 150}},
      },
    },
  },
  {selectors: {'[data-transition-popover] &': {width: 120, flex: 'none'}}},
]);
export const hint = style({margin: 0, opacity: 0.7, fontSize: 12});

globalStyle(`${island} input`, {
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
globalStyle(`${number} input`, {
  paddingRight: 28,
  '@media': {'(max-width: 768px)': {paddingRight: 84}},
});
export const durationSteppers = style([
  {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    '@media': {'(max-width: 768px)': {flexDirection: 'row'}},
  },
  {selectors: {'[data-step-toolbar] &': {flexDirection: 'row', gap: 2}}},
]);
globalStyle(`${durationSteppers} button`, {
  height: 14,
  minHeight: 14,
  width: 20,
  minWidth: 20,
  padding: 0,
  '@media': {
    '(max-width: 768px)': {height: 40, minHeight: 40, width: 40, minWidth: 40},
  },
});
globalStyle(`${number} button svg`, {
  width: 12,
  height: 12,
  '@media': {'(max-width: 768px)': {width: 16, height: 16}},
});
globalStyle('[data-animation-steps-menu] [role="menuitem"]', {
  '@media': {'(max-width: 768px)': {minHeight: 40, minWidth: 40}},
});

export const stripRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: 8,
});

export const scriptControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
});

export const durationLabel = style({
  selectors: {
    '[data-transition-popover] &': {
      whiteSpace: 'nowrap',
      color: c.descriptionTextColor,
    },
  },
});
export const durationInput = style({
  selectors: {
    '[data-step-toolbar] &': {
      height: 32,
      paddingRight: 64,
      '@media': {'(max-width: 768px)': {height: 40, paddingRight: 84}},
    },
    '[data-transition-popover] &': {
      height: 28,
      fontSize: 13,
      '@media': {'(max-width: 768px)': {minHeight: 40, height: 40}},
    },
    '[data-animation-step-sheet] &': {minHeight: 40},
  },
});
export const durationButton = style({
  selectors: {
    '[data-step-toolbar] &': {
      width: 28,
      minWidth: 28,
      height: 28,
      minHeight: 28,
      '@media': {
        '(max-width: 768px)': {
          width: 40,
          minWidth: 40,
          height: 40,
          minHeight: 40,
        },
      },
    },
    '[data-animation-step-sheet] &': {minHeight: 40},
  },
});
export const barTitleLabel = style({
  selectors: {
    '[data-bar-transport] &': {
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
    },
  },
});
