import {assignInlineVars} from '@vanilla-extract/dynamic';
import {VoidProps} from 'solid-js';
import * as styles from './Skeleton.css';

interface SkeletonLineProps {
  width: string;
  height: string;
  radius?: string;
}

export function SkeletonLine(props: VoidProps<SkeletonLineProps>) {
  return (
    <div
      style={assignInlineVars({
        [styles.skeletonVars.lineWidth]: props.width,
        [styles.skeletonVars.lineHeight]: props.height,
        ...(props.radius ? {[styles.skeletonVars.radius]: props.radius} : {}),
      })}
      class={styles.skeletonLine}
    />
  );
}
