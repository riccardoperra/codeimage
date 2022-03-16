import {JSXElement} from 'solid-js';
import {SvgExternalIcon} from '../ui/SvgIcon/SvgExternalIcon';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';

interface TabIconProps {
  src: string | undefined;
}

export function TabIcon(props: TabIconProps): JSXElement {
  return (
    <Box class={styles.tabIcon}>
      <SvgExternalIcon src={props.src} delay={250} />
    </Box>
  );
}
