import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const sectionWrapper = style({
  height: '100vh',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#000',
});

export const content = style({
  maxWidth: '80rem',
  paddingTop: themeVars.spacing[24],
  paddingBottom: themeVars.spacing[24],
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

export const projectInfoContainer = style({
  transform: 'perspective(800px) rotateY(-25deg) rotateX(10deg)',
  position: 'absolute',
  right: 0,
  bottom: 0,
  zIndex: 10,
});

export const title = style({
  fontSize: '8rem',
});

export const description = style({
  fontSize: '5rem',
});

export const projectImage = style({
  width: '100%',
  borderRadius: '16px',
  backgroundRepeat: 'no-repeat',
});
