import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const card = style({
  padding: themeVars.spacing[12],
  paddingTop: themeVars.spacing[6],
  width: '624px',
  height: '540px',
  borderRadius: '8px',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: darkGrayScale.gray2,
});

export const title = style({
  color: 'white',
  display: 'flex',
  alignItems: 'center',

  gap: themeVars.spacing[4],
});

export const badge = style({
  width: '36px',
  height: '36px',
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  overflow: 'hidden',
});

export const badgePicture = style({
  width: '100%',
  position: 'absolute',
  height: '100%',
});
