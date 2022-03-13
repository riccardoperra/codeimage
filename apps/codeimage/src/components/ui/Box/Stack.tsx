import {Box, BoxProps} from './Box';
import * as styles from './Stack.css';
import {themeVars} from '../../../theme/global.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';

interface StackProps extends BoxProps {
  spacing: keyof typeof themeVars.spacing;
}

export const VStack = (props: StackProps) => {
  return (
    <Box
      {...props}
      class={styles.vStack}
      style={assignInlineVars({
        [styles.stackThemeVars.spacing]: themeVars.spacing[props.spacing],
      })}
    >
      {props.children}
    </Box>
  );
};

export const HStack = (props: StackProps) => {
  return (
    <Box
      {...props}
      class={styles.hStack}
      style={assignInlineVars({
        [styles.stackThemeVars.spacing]: themeVars.spacing[props.spacing],
      })}
    >
      {props.children}
    </Box>
  );
};
