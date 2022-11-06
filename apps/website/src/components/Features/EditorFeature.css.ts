import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

export const sectionCount = createVar();
const sectionHeight = createVar();

export const sectionWrapper = style({
  backgroundColor: '#000',
  position: 'relative',
  display: 'flex',
  vars: {
    [sectionHeight]: '60vh',
    [sectionCount]: '3',
  },
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
  flex: 1,
});

export const sectionContainer = style({
  height: `calc(${sectionHeight} * ${sectionCount})`,
  display: 'flex',
  width: '100%',
});

export const textParallaxBox = style({
  height: `${sectionHeight}`,
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
  position: 'absolute',
});

export const editorImageSticky = style({
  position: 'sticky',
  height: `${sectionHeight}`,
  top: 0,
  width: `55%`,
  display: 'flex',
  alignItems: 'center',
});

export const editorImageCardShadowBg = createVar();

export const editorImageCard = style({
  borderRadius: '1.5rem',
  flex: 1,
  background:
    'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  overflow: 'hidden',
  height: '500px',
  position: 'relative',
});

export const editorImageCardBackdrop = style({
  content: '',
  zIndex: -1,
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  background: editorImageCardShadowBg,
  transform: 'translate3d(0px, -50%, 0) scale(0.85)',
  filter: 'blur(500px) saturate(180%)',
  opacity: '0.7',
  transition: 'opacity 0.3s',
  borderRadius: '1.5rem',
  flex: 1,
  overflow: 'hidden',
  height: '500px',
  top: '50%',
});
