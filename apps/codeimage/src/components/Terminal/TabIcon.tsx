import {JSXElement, mergeProps} from 'solid-js';
import {SvgExternalIcon} from '../../ui/SvgIcon/SvgExternalIcon';
import {Box} from '@codeimage/ui';
import * as styles from './terminal.css';
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
      <SvgExternalIcon
        content={computedProps.content}
        delay={computedProps.delay}
      />
    </Box>
  );
}
