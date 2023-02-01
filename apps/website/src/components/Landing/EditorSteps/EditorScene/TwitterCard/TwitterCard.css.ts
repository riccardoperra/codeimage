import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const card = style({
  padding: themeVars.spacing[12],
  paddingTop: themeVars.spacing[6],
  width: '624px',
  height: '584px',
  borderRadius: '16px',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'scale(0) translate3d(-50%, 50%, 0)',
  backgroundColor: darkGrayScale.gray2,
  opacity: 1,
  willChange: 'transform',
});

export const title = style({
  color: 'white',
  display: 'flex',
  alignItems: 'center',

  gap: themeVars.spacing[4],
  marginBottom: themeVars.spacing[4],
});

export const badge = style({
  width: '36px',
  height: '36px',
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  overflow: 'hidden',
});

export const twitterInfo = style({
  opacity: 0,
  transition: 'opacity 300ms ease-in-out',
  selectors: {
    '&[data-visible=true]': {
      opacity: 1,
    },
  },
});
