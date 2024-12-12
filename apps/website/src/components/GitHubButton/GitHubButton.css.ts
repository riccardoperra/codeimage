import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const githubButton = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  padding: 0,
  overflow: 'unset',
  background: 'unset',
  gap: 0,
  ':focus': {
    outline: 'none',
    boxShadow: 'none',
  },
  ':active': {
    outline: 'none',
    boxShadow: 'none',
  },
});

const buttonBgColor = createVar();
const buttonBorderColor = createVar();

export const btn = style([
  {
    position: 'relative',
    display: 'inline-flex',
    fontWeight: '600',
    verticalAlign: 'bottom',
    cursor: 'pointer',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: '-1px -1px',
    backgroundSize: '110% 110%',
    border: '1px solid',
    borderRadius: themeVars.borderRadius.lg,
    background: buttonBgColor,
    paddingLeft: themeVars.spacing[5],
    paddingRight: themeVars.spacing[5],
    textDecoration: 'unset',
    selectors: {
      '&:not(:last-child)': {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      '&:last-child': {
        borderTopLeftRadius: 0,
        borderLeft: 0,
        borderBottomLeftRadius: 0,
      },
    },
  },
  // responsiveStyle({
  //   desktop: {
  //     height: '64px',
  //     borderRadius: '16px',
  //     paddingLeft: themeVars.spacing['6'],
  //     paddingRight: themeVars.spacing['6'],
  //     fontSize: '24px',
  //   },
  // }),
]);

export const content = style([
  btn,
  {
    vars: {
      [buttonBgColor]: 'linear-gradient(180deg, #373e47, #30363d 90%)',
      [buttonBorderColor]: 'rgba(205,217,229,.1)',
    },
    color: '#f0f3f6',
    borderLeft: 0,
    userSelect: 'none',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: '-1px -1px',
    backgroundSize: '110% 110%',
    border: `1px solid ${buttonBorderColor}`,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: themeVars.spacing[2],
    ':hover': {
      borderColor: '#768390',
    },
    ':active': {
      vars: {
        [buttonBgColor]: '#2e3031',
      },
      borderColor: '#768390',
      boxShadow: 'inset 0 0.15em 0.3em rgb(28 33 40 / 15%)',
    },
  },
]);

export const text = style({
  marginTop: '2px',
});

export const socialCount = style([
  btn,
  {
    vars: {
      [buttonBgColor]: '#22272e',
      [buttonBorderColor]: 'rgba(205,217,229,.1)',
    },
    color: '#f0f3f6',
    borderLeft: 0,
    userSelect: 'none',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: '-1px -1px',
    backgroundSize: '110% 110%',
    border: `1px solid ${buttonBorderColor}`,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: '#539bf5',
    },
    ':active': {
      color: '#539bf5',
    },
  },
]);
