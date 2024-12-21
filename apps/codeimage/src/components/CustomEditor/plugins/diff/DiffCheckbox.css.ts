import {themeTokens, themeVars} from '@codeui/kit';
import {createVar, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';

export const container = style({
  opacity: 1,
  transition: 'opacity 150ms ease-in-out',
  display: 'flex',
  height: '100%',
});

export const tooltip = style({
  fontSize: themeTokens.fontSize.xs,
});

const iconBorder = createVar();
export const icon = recipe({
  base: {
    width: '20px',
    height: '20px',
    outline: 'none',
    border: `1px solid ${iconBorder}`,
    vars: {
      [iconBorder]: '#cccccc20',
    },
    ':active': {
      transform: 'scale(1) !important',
    },
    ':focus-visible': {
      outline: `none`,
      borderColor: themeVars.brand,
    },
    selectors: {
      '[data-theme-mode=light] &': {
        background: 'rgba(0,0,0,0.05)',
        color: 'black',
      },
      '[data-theme-mode=light] &:hover': {
        background: 'rgba(0,0,0,0.1)',
        color: 'black',
      },
      '[data-theme-mode=dark] &': {
        background: 'rgba(0,0,0,0.3)',
        color: 'white',
      },
      '[data-theme-mode=dark] &:hover': {
        background: 'rgba(0,0,0,0.5)',
      },
    },
  },
});
