import {themeVars} from '@codeimage/ui';
import {createTheme, fallbackVar, style} from '@vanilla-extract/css';

export const centeredWrapper = style({
  height: 'auto',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
});

export const canvas = style({
  borderRadius: themeVars.borderRadius.xl,
});

export const [snippetTheme, snippetThemeVars] = createTheme({
  controls: {
    red: '#ff5f57',
    yellow: '#febc2e',
    green: '#28c840',
  },
  headerBackground: '',
  contentShadow:
    'rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px',
});

export const canvasContent = style({
  borderRadius: '22px',
  overflow: 'hidden',
});

export const snippetHeader = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: '56px',
  transition: 'background-color .2s ease-in-out',

  selectors: {
    '[data-theme-mode=light] &[data-accent-visible=true]': {
      backgroundColor: fallbackVar(
        snippetThemeVars.headerBackground,
        `rgba(0, 0, 0, .06)`,
      ),
    },
    '[data-theme-mode=dark] &[data-accent-visible=true]': {
      backgroundColor: fallbackVar(
        snippetThemeVars.headerBackground,
        `rgba(255, 255, 255, .06)`,
      ),
    },
  },
});

export const snippet = style({
  width: '500px',
  height: 'auto',
  padding: themeVars.spacing[6],
  backgroundColor: 'rgba(0,0,0,.7)',
  borderRadius: themeVars.borderRadius.lg,
  fontSize: '15px',
  position: 'relative',
});
