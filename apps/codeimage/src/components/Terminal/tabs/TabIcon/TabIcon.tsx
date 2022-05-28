import {JSXElement, mergeProps} from 'solid-js';
import {Box, RemoteSvgIcon} from '@codeimage/ui';
import * as styles from './TabIcon.css';
import {LanguageIconDefinition} from '@codeimage/config';

interface TabIconProps {
  content: LanguageIconDefinition['content'];
  delay?: number;
}

export function TabIcon(props: TabIconProps): JSXElement {
  const computedProps = mergeProps(
    {
      delay: 250,
    },
    props,
  );

  return (
    <Box class={styles.tabIcon}>
      <RemoteSvgIcon
        content={computedProps.content}
        delay={computedProps.delay}
      />
    </Box>
  );
}
