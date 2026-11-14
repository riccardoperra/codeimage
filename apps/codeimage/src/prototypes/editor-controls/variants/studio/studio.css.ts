import {themeVars, withThemeMode} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

export const PHONE_QUERY = '(max-width: 640px)';
const phone = `screen and ${PHONE_QUERY}`;
const finePointer = '(hover: hover) and (pointer: fine)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const sheetHeight = createVar();
export const themeRows = createVar();

const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

const pressable = style({
  transition: `transform 160ms ${easeOut}`,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  selectors: {
    '&:active:not(:disabled)': {transform: 'scale(0.97)'},
    '&:focus-visible': focusRing,
  },
  '@media': {
    [reducedMotion]: {
      transition: 'none',
      selectors: {'&:active:not(:disabled)': {transform: 'none'}},
    },
  },
});

export const root = style({
  position: 'relative',
  display: 'grid',
  gridTemplateAreas: '"rail panel main"',
  gridTemplateColumns: '64px auto minmax(0, 1fr)',
  gridTemplateRows: 'minmax(0, 1fr)',
  height: '100dvh',
  overflow: 'hidden',
  background: c.panel.background,
  color: c.baseText,
  fontSize: '0.8125rem',
  vars: {[sheetHeight]: '0px'},
  '@media': {
    [phone]: {
      gridTemplateAreas: '"main" "rail"',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'minmax(0, 1fr) auto',
    },
  },
});

export const rail = style({
  gridArea: 'rail',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '12px 0 12px',
  '@media': {
    [phone]: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 0,
      padding: '4px 4px env(safe-area-inset-bottom, 0px)',
      borderTop: `1px solid ${c.divider}`,
      background: c.panel.background,
      position: 'relative',
      zIndex: 30,
    },
  },
});

export const railLogo = style({
  display: 'grid',
  placeItems: 'center',
  height: '40px',
  marginBottom: '10px',
  '@media': {[phone]: {display: 'none'}},
});

export const railSpacer = style({
  flex: 1,
  '@media': {[phone]: {display: 'none'}},
});

export const railFooter = style({
  display: 'grid',
  placeItems: 'center',
  '@media': {[phone]: {display: 'none'}},
});

export const railButton = style([
  pressable,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    width: '60px',
    minHeight: '56px',
    padding: '4px 0',
    border: 0,
    borderRadius: '10px',
    background: 'transparent',
    color: c.descriptionTextColor,
    fontFamily: 'inherit',
    fontSize: '0.6875rem',
    fontWeight: 500,
    lineHeight: 1.2,
    cursor: 'pointer',
    selectors: {
      '&[aria-expanded="true"]': {color: c.baseText},
    },
    '@media': {
      [finePointer]: {
        selectors: {'&:hover': {color: c.baseText}},
      },
      [phone]: {
        flex: 1,
        width: 'auto',
        minHeight: '52px',
        selectors: {'&:not([data-phone="tab"])': {display: 'none'}},
      },
    },
  },
]);

export const railIcon = style({
  display: 'grid',
  placeItems: 'center',
  width: '40px',
  height: '28px',
  borderRadius: '14px',
  selectors: {
    [`${railButton}[aria-expanded="true"] &`]: {
      background: c.button.primaryAlt.backgroundColor,
      color: c.primary,
    },
  },
  '@media': {
    [finePointer]: {
      selectors: {
        [`${railButton}:hover:not([aria-expanded="true"]) &`]: {
          background: c.input.backgroundColor,
        },
      },
    },
    [phone]: {
      selectors: {
        [`${railButton}[data-owns-open] &`]: {
          background: c.button.primaryAlt.backgroundColor,
          color: c.primary,
        },
      },
    },
  },
});

export const panel = style({
  gridArea: 'panel',
  display: 'flex',
  flexDirection: 'column',
  width: '280px',
  minHeight: 0,
  background: c.panel.background,
  selectors: {
    '&[data-wide]': {width: '360px'},
    '&[hidden]': {display: 'none'},
  },
  '@media': {
    [phone]: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      zIndex: 20,
      width: 'auto',
      height: sheetHeight,
      borderTop: `1px solid ${c.divider}`,
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 -12px 32px rgba(0, 0, 0, 0.28)',
      selectors: {'&[data-wide]': {width: 'auto'}},
    },
  },
});

export const sheetGrip = style({
  display: 'none',
  '@media': {
    [phone]: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '8px',
      selectors: {
        '&::before': {
          content: '""',
          width: '36px',
          height: '5px',
          borderRadius: '3px',
          background: c.input.accentColor,
        },
      },
    },
  },
});

export const panelHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0,
  height: '52px',
  padding: '0 10px 0 16px',
  '@media': {
    [phone]: {height: '48px', touchAction: 'none', cursor: 'grab'},
  },
});

export const panelGrabArea = style({
  flexShrink: 0,
  '@media': {[phone]: {touchAction: 'none'}},
});

export const panelTitle = style({
  flex: 1,
  margin: 0,
  fontSize: '0.9375rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
});

export const panelPage = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  selectors: {'&[hidden]': {display: 'none'}},
});

export const panelBody = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  padding: '2px 16px 16px',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});

export const iconButton = style([
  pressable,
  {
    display: 'grid',
    placeItems: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    border: 0,
    borderRadius: '8px',
    background: 'transparent',
    color: c.descriptionTextColor,
    cursor: 'pointer',
    '@media': {
      [finePointer]: {
        selectors: {
          '&:hover': {background: c.input.backgroundColor, color: c.baseText},
        },
      },
      [phone]: {width: '40px', height: '40px'},
    },
  },
]);

export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

export const desktopOnly = style({
  '@media': {[phone]: {display: 'none'}},
});

export const phoneOnly = style({
  display: 'none',
  '@media': {[phone]: {display: 'contents'}},
});

export const main = style({
  gridArea: 'main',
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
  padding: '8px 8px 8px 0',
  '@media': {[phone]: {padding: 0}},
});

export const canvas = style({
  position: 'relative',
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
  borderRadius: '16px',
  border: `1px solid ${c.divider}`,
  background: c.background,
  '@media': {
    // The prototype picker floats over the top 64px on phones, where a
    // shipped build would keep its top bar.
    [phone]: {
      height: `calc(100% - ${sheetHeight})`,
      paddingTop: '64px',
      borderRadius: 0,
      border: 0,
    },
  },
});

// Controls

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

export const sectionTitle = style({
  margin: 0,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: c.descriptionTextColor,
});

export const divider = style({
  height: '1px',
  flexShrink: 0,
  background: c.divider,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  minHeight: '30px',
  '@media': {[phone]: {minHeight: '44px'}},
});

export const label = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: c.input.labelTextColor,
});

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const hint = style({
  margin: 0,
  fontSize: '0.75rem',
  lineHeight: 1.4,
  color: c.descriptionTextColor,
});

export const value = style({
  fontVariantNumeric: 'tabular-nums',
  color: c.descriptionTextColor,
});

export const switchRoot = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minHeight: '30px',
  '@media': {[phone]: {minHeight: '44px'}},
});

export const switchLabel = style([
  label,
  {
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
  },
]);

export const switchControl = style({
  position: 'relative',
  flexShrink: 0,
  width: '30px',
  height: '18px',
  borderRadius: '9px',
  background: c.button.base.backgroundColor,
  cursor: 'pointer',
  transition: 'background-color 120ms ease',
  selectors: {
    '&[data-checked]': {background: c.primary},
    [`${switchRoot}:has(input:focus-visible) &`]: focusRing,
  },
  '@media': {[phone]: {width: '40px', height: '24px', borderRadius: '12px'}},
});

export const switchThumb = style({
  position: 'absolute',
  top: '2px',
  left: '2px',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  transition: `transform 120ms ${easeOut}`,
  selectors: {
    '&[data-checked]': {transform: 'translateX(12px)'},
  },
  '@media': {
    [phone]: {
      width: '20px',
      height: '20px',
      selectors: {'&[data-checked]': {transform: 'translateX(16px)'}},
    },
    [reducedMotion]: {transition: 'none'},
  },
});

export const segmented = style({
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: 'minmax(0, 1fr)',
  gap: '2px',
  padding: '2px',
  borderRadius: '8px',
  background: c.input.backgroundColor,
});

export const segment = style({
  position: 'relative',
  height: '26px',
  borderRadius: '6px',
  color: c.descriptionTextColor,
  selectors: {
    '&[data-checked]': {
      color: c.baseText,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.16)',
    },
    ...withThemeMode(
      {
        dark: {background: '#383838'},
        light: {background: '#ffffff'},
      },
      '&[data-checked]',
    ),
    '&:has(input:focus-visible)': focusRing,
  },
  '@media': {
    [phone]: {height: '38px'},
    [finePointer]: {
      selectors: {'&:hover:not([data-checked])': {color: c.baseText}},
    },
  },
});

export const segmentLabel = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  whiteSpace: 'nowrap',
});

export const selectTrigger = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '150px',
    height: '30px',
    padding: '0 6px 0 10px',
    border: 0,
    borderRadius: '7px',
    background: c.input.backgroundColor,
    color: c.input.textColor,
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    selectors: {
      '&:active:not(:disabled)': {transform: 'none'},
      '&:disabled': {opacity: 0.55, cursor: 'default'},
    },
    '@media': {
      [phone]: {height: '40px', width: '176px'},
    },
  },
]);

export const selectTriggerWide = style({width: '100%'});

export const selectValue = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
});

export const selectIcon = style({
  display: 'grid',
  color: c.descriptionTextColor,
});

export const selectContent = style({
  zIndex: 60,
  minWidth: 'var(--kb-popper-anchor-width)',
  maxHeight: 'min(320px, var(--kb-popper-content-available-height))',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '4px',
  borderRadius: '9px',
  border: `1px solid ${c.divider}`,
  background: c.listBox.panelBackground,
  color: c.listBox.textColor,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.24)',
  selectors: {
    ...withThemeMode({light: {background: '#ffffff'}}),
  },
});

export const selectListbox = style({outline: 'none'});

export const selectItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  height: '30px',
  padding: '0 8px',
  borderRadius: '6px',
  fontSize: '0.8125rem',
  cursor: 'default',
  outline: 'none',
  selectors: {
    '&[data-highlighted]': {background: c.listBox.hoverBackgroundColor},
    ...withThemeMode({light: {background: '#f0f0f0'}}, '&[data-highlighted]'),
    '&[data-selected]': {fontWeight: 600},
  },
  '@media': {[phone]: {height: '40px'}},
});

export const selectItemIndicator = style({
  display: 'grid',
  color: c.primary,
});

export const textInput = style({
  width: '100%',
  minWidth: 0,
  height: '30px',
  padding: '0 10px',
  border: 0,
  borderRadius: '7px',
  background: c.input.backgroundColor,
  color: c.input.textColor,
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  selectors: {
    '&:focus-visible': focusRing,
    '&::placeholder': {color: c.descriptionTextColor},
  },
  '@media': {[phone]: {height: '40px', fontSize: '16px'}},
});

export const numberInput = style([
  textInput,
  {width: '88px', textAlign: 'right', fontVariantNumeric: 'tabular-nums'},
]);

export const range = style({
  flex: 1,
  minWidth: 0,
  height: '20px',
  margin: 0,
  accentColor: c.primary,
  cursor: 'pointer',
  selectors: {'&:focus-visible': focusRing},
  '@media': {[phone]: {height: '40px'}},
});

export const rangeValue = style([
  value,
  {width: '40px', textAlign: 'right', flexShrink: 0},
]);

export const button = style([
  pressable,
  {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '32px',
    padding: '0 12px',
    border: 0,
    borderRadius: '8px',
    background: c.button.base.backgroundColor,
    color: c.button.base.textColor,
    fontFamily: 'inherit',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    selectors: {
      '&:disabled': {opacity: 0.5, cursor: 'default'},
    },
    '@media': {
      [finePointer]: {
        selectors: {
          '&:hover:not(:disabled)': {background: c.button.base.hoverColor},
        },
      },
      [phone]: {height: '44px'},
    },
  },
]);

export const buttonPrimary = style({
  background: c.button.primary.backgroundColor,
  color: c.button.primary.textColor,
  '@media': {
    [finePointer]: {
      selectors: {
        '&:hover:not(:disabled)': {background: c.button.primary.hoverColor},
      },
    },
  },
});

export const buttonBlock = style({width: '100%'});

export const buttonRow = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
});

export const kbd = style({
  marginLeft: 'auto',
  paddingLeft: '8px',
  fontSize: '0.6875rem',
  opacity: 0.75,
  fontVariantNumeric: 'tabular-nums',
  '@media': {[phone]: {display: 'none'}},
});

export const swatchGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
  gap: '6px',
  '@media': {
    [phone]: {gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: '8px'},
  },
});

export const swatch = style([
  pressable,
  {
    aspectRatio: '1',
    width: '100%',
    padding: 0,
    border: 0,
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 1px rgba(127, 127, 127, 0.25)',
    selectors: {
      '&[aria-checked="true"]': {
        outline: `2px solid ${c.primary}`,
        outlineOffset: '2px',
      },
    },
  },
]);

export const windowGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
});

export const windowTile = style({
  position: 'relative',
  height: '72px',
  overflow: 'hidden',
  borderRadius: '8px',
  background: c.input.backgroundColor,
  cursor: 'pointer',
  selectors: {
    '&[data-checked]': {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '1px',
    },
    '&:has(input:focus-visible)': focusRing,
  },
});

export const windowTileLabel = style({
  position: 'absolute',
  inset: 0,
  cursor: 'pointer',
  zIndex: 1,
});

export const windowTilePreview = style({
  position: 'absolute',
  top: '8px',
  left: '8px',
  width: '220px',
  zoom: 0.5,
  pointerEvents: 'none',
});

export const windowTileCaption = style({
  position: 'absolute',
  left: '8px',
  bottom: '6px',
  fontSize: '0.6875rem',
  fontWeight: 500,
  color: c.descriptionTextColor,
  pointerEvents: 'none',
  selectors: {[`${windowTile}[data-checked] &`]: {color: c.baseText}},
});

// Themes gallery

export const themeToolbar = style({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  flexShrink: 0,
});

export const searchBox = style({
  position: 'relative',
  flex: 1,
  minWidth: 0,
});

export const searchIcon = style({
  position: 'absolute',
  left: '9px',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'grid',
  color: c.descriptionTextColor,
  pointerEvents: 'none',
});

export const searchInput = style([
  textInput,
  {
    paddingLeft: '30px',
    selectors: {'&::-webkit-search-cancel-button': {display: 'none'}},
  },
]);

export const toneGroup = style({flexShrink: 0, width: '140px'});

export const themeBody = style([panelBody, {gap: '12px', overflow: 'hidden'}]);

export const themeScroller = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  containerType: 'size',
  margin: '0 -4px',
  padding: '4px',
});

export const themeGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  columnGap: '8px',
  rowGap: '8px',
  gridAutoRows: `clamp(52px, calc((100cqh - 8px - (${themeRows} - 1) * 8px) / ${themeRows}), 104px)`,
  outline: 'none',
  '@media': {
    [phone]: {
      rowGap: '6px',
      gridAutoRows: `clamp(40px, calc((100cqh - 8px - (${themeRows} - 1) * 6px) / ${themeRows}), 96px)`,
    },
  },
});

export const themeTile = style([
  pressable,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: c.descriptionTextColor,
    fontFamily: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    selectors: {
      '&:active:not(:disabled)': {transform: 'scale(0.98)'},
      '&:focus-visible': {outline: 'none'},
      '&[aria-checked="true"]': {color: c.baseText},
    },
    '@media': {
      [finePointer]: {selectors: {'&:hover': {color: c.baseText}}},
      [phone]: {position: 'relative'},
    },
  },
]);

export const themeArt = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  width: '100%',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundSize: 'cover',
  backgroundPosition: '50% 50%',
  boxShadow: 'inset 0 0 0 1px rgba(127, 127, 127, 0.2)',
  selectors: {
    [`${themeTile}[aria-checked="true"] &`]: {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '2px',
    },
    [`${themeTile}:focus-visible &`]: {
      outline: `2px solid ${c.primary}`,
      outlineOffset: '2px',
    },
  },
});

export const themePreview = style({
  position: 'absolute',
  top: '8%',
  left: '50%',
  width: '232px',
  zoom: 0.4,
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
  '@media': {[phone]: {zoom: 0.3}},
});

export const themeCheck = style({
  position: 'absolute',
  top: '4px',
  right: '4px',
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: c.primary,
  color: '#fff',
});

export const themeName = style({
  flexShrink: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  lineHeight: '14px',
  fontWeight: 500,
  '@media': {
    [phone]: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '10px 6px 3px',
      borderRadius: '0 0 8px 8px',
      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.65))',
      color: '#fff',
      fontSize: '0.6875rem',
    },
  },
});

export const emptyState = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '8px 0',
});

export const presetsHost = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '0 12px 12px 16px',
  overflow: 'hidden',
});

export const resolution = style([value, {fontSize: '0.75rem'}]);

// Last, so it wins over the display of the button it sits on.
export const phoneOnlyFlex = style({
  display: 'none',
  '@media': {[phone]: {display: 'inline-flex', alignItems: 'center'}},
});
