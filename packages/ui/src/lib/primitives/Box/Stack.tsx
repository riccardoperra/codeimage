import clsx from 'clsx';
import {omitProps} from 'solid-use';
import {Box, BoxProps} from './Box';
import * as styles from './Stack.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {themeVars} from '../../theme';

type Spacing = keyof typeof themeVars.spacing;

interface StackProps extends BoxProps {
  spacing: Spacing | `${Spacing}`;
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
      {...omitProps(props, ['class', 'style'])}
      class={clsx(styles.hStack, props.class)}
      style={assignInlineVars({
        [styles.stackThemeVars.spacing]: themeVars.spacing[props.spacing],
      })}
    >
      {props.children}
    </Box>
  );
};
