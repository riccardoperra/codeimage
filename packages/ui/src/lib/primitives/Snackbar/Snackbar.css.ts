import {style, styleVariants} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const snackbar = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: `${themeVars.dynamicColors.snackbar.backgroundColor}!important`,
  color: `${themeVars.dynamicColors.snackbar.textColor}!important`,
  borderRadius: `${themeVars.borderRadius.xl}!important`,
  padding: `${themeVars.spacing['3']}!important`,
});

export const hostWrapper = style({
  position: 'fixed',
  inset: '16px',
  pointerEvents: 'none',
  zIndex: 9999,
});

export const host = style({
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  rowGap: themeVars.spacing['2'],
  width: 'max-content',
  maxWidth: '100%',
});

export const position = styleVariants({
  'top-left': {top: 0, left: 0, alignItems: 'flex-start'},
  'top-center': {top: 0, left: '50%', transform: 'translateX(-50%)'},
  'top-right': {top: 0, right: 0, alignItems: 'flex-end'},
  'bottom-left': {
    bottom: 0,
    left: 0,
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
  },
  'bottom-center': {
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column-reverse',
  },
  'bottom-right': {
    bottom: 0,
    right: 0,
    flexDirection: 'column-reverse',
    alignItems: 'flex-end',
  },
});

export const toastItem = style({
  pointerEvents: 'auto',
  gap: themeVars.spacing['2'],
  maxWidth: '350px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 12%)',
});

export const message = style({
  flex: 1,
  fontSize: themeVars.fontSize.sm,
  lineHeight: 1.25,
});

const statusIcon = style({
  width: '20px',
  height: '20px',
  flex: '0 0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  color: 'white',
});

export const success = style([statusIcon, {background: '#61d345'}]);
export const error = style([statusIcon, {background: '#ff4b4b'}]);
