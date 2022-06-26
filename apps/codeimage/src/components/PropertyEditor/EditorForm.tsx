import {Box} from '@codeimage/ui';
import {createPlatformProps} from '@core/hooks/createPlatformProps';
import {ParentComponent} from 'solid-js';
import * as styles from './EditorSidebar.css';

export const EditorForm: ParentComponent = props => {
  const platformProps = createPlatformProps();

  return (
    <Box class={styles.sidebar} {...platformProps}>
      {props.children}
    </Box>
  );
};
