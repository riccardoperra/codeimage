import {style} from '@vanilla-extract/css';
import {textFieldStyles, themeVars} from '@codeimage/ui';

export const wrapper = style([
  textFieldStyles.textFieldTheme,
  {
    position: 'relative',
    display: 'flex',
    width: 'auto',
    alignItems: 'center',
    border: `1px solid ${textFieldStyles.textFieldVars.borderColor}`,
    backgroundColor: textFieldStyles.textFieldVars.background,
    borderRadius: themeVars.borderRadius.md,
    ':focus': {
      borderColor: themeVars.backgroundColor.blue['500'],
    },

    selectors: {
      [`&${textFieldStyles.textField}`]: {
        width: '1px',
        flexGrow: '1',
        border: 'none',
        background: 'none',
      },
      [`&${textFieldStyles.textField}`]: {
        outline: 'none',
      },
    },
  },
]);
