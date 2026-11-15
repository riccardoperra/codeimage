import {themeVars, withThemeMode} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

// Floats over the canvas above the frame toolbar, which is 50px tall and
// 20px from the bottom.
export const island = style({
  position: 'absolute',
  left: '50%',
  bottom: '82px',
  transform: 'translateX(-50%)',
  width: 'min(760px, calc(100% - 32px))',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: themeVars.borderRadius.xl,
  zIndex: themeVars.zIndex['40'],
  selectors: {
    ...withThemeMode({
      dark: {
        background: darkGrayScale.gray2,
        boxShadow: themeVars.boxShadow.md,
      },
      light: {
        background: themeVars.backgroundColor.white,
        boxShadow: themeVars.boxShadow.lg,
      },
    }),
  },
  '@media': {
    'screen and (max-width: 768px)': {
      bottom: '16px',
      width: 'calc(100% - 32px)',
    },
  },
});

export const transport = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '12px',
  minHeight: '40px',
});

export const timing = style({
  '@media': {
    'screen and (max-width: 768px)': {
      flex: '1 1 0',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
});

export const time = style({
  flexShrink: 0,
  minWidth: '76px',
  textAlign: 'right',
  fontSize: themeVars.fontSize.sm,
  fontVariantNumeric: 'tabular-nums',
  color: themeVars.dynamicColors.descriptionTextColor,
  '@media': {
    'screen and (max-width: 768px)': {
      display: 'none',
    },
  },
});

export const steps = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const step = style({
  flex: '1 1 120px',
  maxWidth: '220px',
  minWidth: 0,
  height: '40px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 4px 0 10px',
  borderRadius: themeVars.borderRadius.lg,
  border: '1px solid transparent',
  cursor: 'grab',
  userSelect: 'none',
  fontSize: themeVars.fontSize.sm,
  color: themeVars.dynamicColors.baseText,
  selectors: {
    ...withThemeMode({
      dark: {background: darkGrayScale.gray4},
      light: {background: themeVars.backgroundColor.gray['200']},
    }),
    '&[data-current]': {
      borderColor: themeVars.dynamicColors.primary,
    },
    '&[data-drop-target]': {
      boxShadow: `inset 3px 0 0 ${themeVars.dynamicColors.primary}`,
    },
    '&[data-dragging]': {
      opacity: 0.5,
    },
  },
});

export const stepIndex = style({
  flexShrink: 0,
  fontVariantNumeric: 'tabular-nums',
  color: themeVars.dynamicColors.descriptionTextColor,
});

export const stepName = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const stepHold = style({
  flexShrink: 0,
  height: '32px',
  padding: '0 8px',
  border: 'none',
  borderRadius: themeVars.borderRadius.md,
  background: 'transparent',
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      color: themeVars.dynamicColors.baseText,
    },
  },
});

export const popover = style({
  width: '320px',
  maxWidth: 'calc(100vw - 32px)',
});

export const popoverActions = style({
  display: 'flex',
  gap: '8px',
  paddingTop: '8px',
});
