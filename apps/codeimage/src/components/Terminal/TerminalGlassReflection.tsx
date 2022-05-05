import {Box} from '@codeimage/ui';
import * as styles from './terminal.css';

export const TerminalGlassReflection = () => {
  return (
    <Box class={styles.glassReflection.wrapper}>
      <Box class={styles.glassReflection.content} />
    </Box>
  );
};
