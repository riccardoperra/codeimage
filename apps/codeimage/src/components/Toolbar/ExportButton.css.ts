import {themeVars} from '@codeimage/ui';
import {buttonStyles} from '@codeui/kit';
import {globalStyle, style} from '@vanilla-extract/css';

const mobile = 'screen and (max-width: 768px)';

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  '@media': {
    [mobile]: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: themeVars.spacing['3'],
    },
  },
});

export const footerSecondary = style({
  '@media': {
    [mobile]: {
      alignSelf: 'flex-start',
    },
  },
});

export const altTextAction = style({
  marginLeft: `calc(-1 * ${buttonStyles.buttonVars.padding})`,
});

export const footerActions = style({
  display: 'flex',
  gap: themeVars.spacing['2'],
});

globalStyle(`${footerActions} > *`, {
  minWidth: '96px',
  '@media': {
    [mobile]: {
      flex: 1,
    },
  },
});
