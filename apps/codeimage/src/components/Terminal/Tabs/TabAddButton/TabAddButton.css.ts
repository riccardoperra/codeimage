import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {tabVars} from '../Tab/Tab.css';

export const button = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.borderRadius.full,
  appearance: 'none',
  border: 'none',
  width: '24px',
  height: '24px',
  minWidth: '24px',
  textAlign: 'center',
  padding: 0,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  ':disabled': {
    cursor: 'not-allowed',
    opacity: '.25',
  },
  ':focus': {
    backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .05)`,
  },
  selectors: {
    '[data-theme-mode=dark] &': {
      color: themeVars.backgroundColor.white,
      vars: {
        [tabVars.tabSecondaryHoverBg]: '255, 255, 255',
      },
    },
    '[data-theme-mode=light] &': {
      color: themeVars.backgroundColor.black,
      vars: {
        [tabVars.tabSecondaryHoverBg]: '0, 0, 0',
      },
    },
    '&:not(:disabled):active': {
      backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .25)`,
    },
    '&:not(:disabled):hover': {
      backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .10)`,
    },
  },
});
