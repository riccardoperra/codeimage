import {themeVars} from '@codeimage/ui';
import {createGlobalTheme, globalStyle} from '@vanilla-extract/css';

globalStyle('body', {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  '@supports': {
    '(font-variation-settings: normal)': {
      // Inter var
      fontFamily: 'Inter var, system-ui, -apple-system, sans-serif',
      fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
    },
  },
});

const cssVar = /(--)[^\,\:\)]+/;

globalStyle(`[data-codeimage-theme=dark]`, {
  [cssVar.exec(themeVars.dynamicColors.panel.background)![0]]: '#151516',
  [cssVar.exec(themeVars.dynamicColors.background)![0]]: '#0f0f10',
});
