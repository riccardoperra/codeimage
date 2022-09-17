import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import * as styles from './ProjectItemSkeleton.css';

export function ProjectItemSkeleton() {
  return (
    <li class={styles.itemSkeleton}>
      <SkeletonLine width={'95%'} height={'16px'} />
      <SkeletonDivider height={'12px'} />
      <SkeletonLine width={'65%'} height={'16px'} />
      <SkeletonDivider height={'13px'} />
    </li>
  );
}
