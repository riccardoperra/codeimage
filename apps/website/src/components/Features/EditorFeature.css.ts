import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const sectionWrapper = style({
  backgroundColor: '#000',
  position: 'relative',
  display: 'flex',
});

export const content = style({
  maxWidth: '80rem',
  position: 'relative',
  display: 'flex',
  margin: 'auto',
});

export const editorSectionInfo = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingRight: themeVars.spacing[24],
  position: 'relative',
  overflow: 'hidden',
  order: -1,
});

export const sectionContainer = style({
  height: 'calc(70vh * 3)',
  display: 'flex',
  width: '100%',
});

export const textParallaxBox = style({
  height: '70vh',
  display: 'flex',
  alignItems: 'center',
});

export const editorParallaxContent = style({
  display: 'flex',
  flexDirection: 'column',
});

export const scrollContainer = style({
  display: 'flex',
  flexDirection: 'column',
  top: 0,
});

export const editorImage = style({
  padding: themeVars.spacing[12],
});

export const editorImageSticky = style({
  position: 'sticky',
  height: '70vh',
  top: 0,
  width: `55%`,
  display: 'flex',
  alignItems: 'center',
});

export const editorImageCard = style({
  borderRadius: '1.5rem',
  flex: 1,
  background:
    'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  overflow: 'hidden',
  height: '500px',
});
