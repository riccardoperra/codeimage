import {LanguageIconDefinition} from '@codeimage/config';
import {Box, RemoteSvgIcon} from '@codeimage/ui';
import {JSXElement, mergeProps} from 'solid-js';
import * as styles from './TabIcon.css';

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
