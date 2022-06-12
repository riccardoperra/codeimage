import * as styles from '@ui/Skeleton/Skeleton.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {VoidProps} from 'solid-js';

interface SkeletonDividerProps {
  height: string;
}

export function SkeletonDivider(props: VoidProps<SkeletonDividerProps>) {
  return (
    <div
      style={assignInlineVars({
        [styles.skeletonVars.lineHeight]: props.height,
      })}
      class={styles.skeletonDivider}
    />
  );
}
