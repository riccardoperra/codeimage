import {themeVars} from '@codeui/kit';
import {style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';

export const item = style({
  alignContent: 'center',
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  gap: '10px',
  height: 'min-content',
  justifyContent: 'flex-start',
  overflow: 'visible',
  padding: '0',
  position: 'relative',
  textDecoration: 'none',
  width: '100%',
});

export const metadata = style({
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  alignSelf: 'stretch',
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  flexWrap: 'nowrap',
  gap: '0px',
  height: 'auto',
  justifyContent: 'flex-start',
  overflow: 'visible',
  padding: '0',
  position: 'relative',
  width: '170px',
});

export const metadataContent = style({
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  flexWrap: 'nowrap',
  gap: '15px',
  height: 'min-content',
  justifyContent: 'flex-start',
  overflow: 'visible',
  padding: '0',
  position: 'sticky',
  // top: '40px',
  top: 0,
  width: '100%',
  willChange: 'transform',
  zIndex: '1',
});

export const metadataVersionBadgeContainer = style({
  flex: 'none',
  height: 'auto',
  position: 'relative',
  width: 'auto',
});

export const metadataVersionBadge = recipe({
  base: {
    alignContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: '10px',
    height: 'min-content',
    justifyContent: 'flex-start',
    overflow: 'visible',
    padding: '6px 20px',
    position: 'relative',
    width: 'min-content',
    textDecoration: 'none',

    backgroundColor: themeVars.brandSoft,
    transition: 'background-color 150ms ease-in-out',
    color: themeVars.brandLink,
    opacity: '1',
    borderRadius: '8px',

    ':hover': {
      backgroundColor: themeVars.brandSoftAccentHover,
    },
  },
  variants: {
    latest: {
      true: {
        background: themeVars.brand,
        color: themeVars.foreground,
        outline: `1px solid ${themeVars.brand}`,
        outlineOffset: '3px',

        ':hover': {
          background: themeVars.brandAccentHover,
          outlineColor: themeVars.brandAccentHover,
        },
      },
    },
  },
});

export const metadataVersionDate = style({
  color: 'rgba(255, 255, 255, .6)',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  flexShrink: '0',
  transform: 'none',
  opacity: '1',

  flex: 'none',
  height: 'auto',
  position: 'relative',
  whiteSpace: 'pre',
  width: 'auto',
});

export const content = style({
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  display: 'flex',
  flex: '1 0 0px',
  flexDirection: 'column',
  flexWrap: 'nowrap',
  height: 'min-content',
  justifyContent: 'center',
  overflow: 'visible',
  padding: '0',
  position: 'relative',
  width: '1px',
});
