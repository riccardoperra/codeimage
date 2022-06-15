import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import * as styles from './TerminalControlFieldSkeleton.css';

export function TerminalControlSkeleton() {
  return (
    <div class={styles.wrapper}>
      <SkeletonLine radius={'8px'} width={'100%'} height={'20px'} />
    </div>
  );
}
