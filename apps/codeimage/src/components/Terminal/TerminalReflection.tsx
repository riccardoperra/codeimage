import {Box} from '@codeimage/ui';
import * as styles from './terminal.css';

export const TerminalReflection = () => {
  return (
    <Box class={styles.reflection.wrapper}>
      <Box class={styles.reflection.content} />
    </Box>
  );
};
