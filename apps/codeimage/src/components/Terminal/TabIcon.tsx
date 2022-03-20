import {JSXElement} from 'solid-js';
import {SvgExternalIcon} from '../ui/SvgIcon/SvgExternalIcon';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';
import {LanguageIconDefinition} from '@codeimage/config';

interface TabIconProps {
  content: LanguageIconDefinition['content'];
}

export function TabIcon(props: TabIconProps): JSXElement {
  return (
    <Box class={styles.tabIcon}>
      <SvgExternalIcon content={props.content} delay={250} />
    </Box>
  );
}
