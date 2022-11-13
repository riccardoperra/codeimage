import {Box} from '@codeimage/ui';

import {
  isAndroid,
  isChrome,
  isFirefox,
  isIOS,
} from '@solid-primitives/platform';
import {ParentComponent} from 'solid-js';
import * as styles from './EditorSidebar.css';

const platform = () => {
  if (isFirefox) {
    return 'firefox';
  }
  if (isChrome) {
    return 'chrome';
  }
  if (isIOS) {
    return 'ios';
  }
  if (isAndroid) {
    return 'android';
  }
};

export const createPlatformProps = () => {
  return {
    'data-platform': platform(),
  };
};

export const EditorForm: ParentComponent = props => {
  const platformProps = createPlatformProps();

  return (
    <Box class={styles.sidebar} {...platformProps}>
      {props.children}
    </Box>
  );
};
