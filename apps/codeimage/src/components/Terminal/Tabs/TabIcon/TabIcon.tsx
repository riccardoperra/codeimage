import {type LanguageIconDefinition} from '@codeimage/config';
import {Box, RemoteSvgIcon, type SvgExternalIconProps} from '@codeimage/ui';
import {type JSXElement, mergeProps} from 'solid-js';
import * as styles from './TabIcon.css';

interface TabIconProps {
  content: LanguageIconDefinition['content'];
  delay?: number;
  size?: SvgExternalIconProps['size'];
}

export function TabIcon(props: TabIconProps): JSXElement {
  const computedProps = mergeProps(
    {
      delay: 250,
      size: 'md' as SvgExternalIconProps['size'],
    },
    props,
  );

  return (
    <Box class={styles.tabIcon}>
      <RemoteSvgIcon
        content={computedProps.content}
        delay={computedProps.delay}
        size={computedProps.size}
      />
    </Box>
  );
}
