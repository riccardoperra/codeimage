import {ExperimentalIcon} from '@ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip';
import * as styles from './ExperimentalChip.css';

export function ExperimentalChip() {
  return (
    <span class={styles.chip}>
      <ExperimentalIcon size={'md'} />
      <span>Experimental</span>
    </span>
  );
}
