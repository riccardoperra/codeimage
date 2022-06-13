import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import * as styles from './FrameSkeleton.css';

export function FrameSkeleton() {
  return (
    <div class={styles.wrapper}>
      <div class={styles.terminal.base}>
        <div class={styles.terminal.header} />
        <div class={styles.terminal.content}>
          <SkeletonLine width={'95%'} height={'16px'} />
          <SkeletonDivider height={'12px'} />
          <SkeletonLine width={'95%'} height={'16px'} />
          <SkeletonDivider height={'13px'} />
          <SkeletonLine width={'80%'} height={'16px'} />
          <SkeletonDivider height={'40px'} />
          <SkeletonLine width={'80%'} height={'16px'} />
          <SkeletonDivider height={'12px'} />
          <SkeletonLine width={'95%'} height={'16px'} />
          <SkeletonDivider height={'40px'} />
          <SkeletonLine width={'75%'} height={'16px'} />
          <SkeletonDivider height={'12px'} />
          <SkeletonLine width={'55%'} height={'16px'} />
          <SkeletonDivider height={'12px'} />
          <SkeletonLine width={'50%'} height={'16px'} />
        </div>
      </div>
    </div>
  );
}
