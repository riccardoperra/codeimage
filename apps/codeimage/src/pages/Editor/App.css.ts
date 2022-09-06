import {
  adaptiveFullScreenHeight,
  backgroundColorVar,
  themeVars,
} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {scaffoldVars} from '../../components/Scaffold/Scaffold.css';

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    width: '100vw',
    position: 'relative',
    display: 'flex',
    height: `calc(100vh - ${scaffoldVars.toolbarHeight})`,

    '@media': {
      'screen and (max-width: 768px)': {
        flexDirection: 'column',
      },
    },
  },
]);

export const canvasToolbar = style({
  height: '42px',
  backgroundColor: backgroundColorVar,
  color: themeVars.dynamicColors.baseText,
  width: '100%',
  borderRadius: '0',
  boxShadow: themeVars.boxShadow.md,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem',
});

export const mobileActionToolbar = style({
  backdropFilter: 'blur(20px) saturate(180%)',
  position: 'absolute',
  width: '100%',
  zIndex: themeVars.zIndex['10'],
});
