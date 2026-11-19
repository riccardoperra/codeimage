import type {LanguageIconDefinition} from '@codeimage/config';
import type {SvgExternalIconProps} from '@codeimage/ui';
import {Box, RemoteSvgIcon} from '@codeimage/ui';
import type {JSX} from '@solidjs/web';
import {merge} from 'solid-js';
import * as styles from './TabIcon.css';

interface TabIconProps {
  content: LanguageIconDefinition['content'];
  delay?: number;
  size?: SvgExternalIconProps['size'];
}

export function TabIcon(props: TabIconProps): JSX.Element {
  const defaultSize: SvgExternalIconProps['size'] = 'md';
  const computedProps = merge(
    {
      delay: 250,
      size: defaultSize,
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
