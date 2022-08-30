import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import * as styles from './ThemeBoxSkeleton.css';

export function ThemeBoxSkeleton() {
  return (
    <div class={styles.wrapper}>
      <div class={styles.content}>
        <SkeletonLine width={'100%'} height={'40px'} />
        <SkeletonDivider height={'20px'} />
        <SkeletonLine width={'90%'} height={'8px'} />
        <SkeletonDivider height={'12px'} />
        <SkeletonLine width={'90%'} height={'8px'} />
        <SkeletonDivider height={'12px'} />
        <SkeletonLine width={'80%'} height={'8px'} />
      </div>
    </div>
  );
}
