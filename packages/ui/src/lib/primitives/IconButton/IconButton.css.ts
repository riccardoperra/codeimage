import {recipe} from '@vanilla-extract/recipes';
import {buttonHeight as btnSize} from '../Button/Button.css';

export const buttonIconVariants = recipe({
  base: {
    width: btnSize,
    padding: 0,
    textAlign: 'center',
    minWidth: 'auto',
  },
  variants: {
    size: {
      md: {
        vars: {
          [btnSize]: '42px',
        },
      },
      sm: {
        vars: {
          [btnSize]: '36px',
        },
      },
      xs: {
        vars: {
          [btnSize]: '30px',
        },
      },
      xxs: {
        vars: {
          [btnSize]: '24px',
        },
      },
    },
  },
});
