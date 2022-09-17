import {Box} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentProps, VoidProps} from 'solid-js';
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

export function SkeletonVCenter(props: ParentProps) {
  return (
    <Box height={'100%'} display={'flex'} alignItems={'center'} flexGrow={1}>
      {props.children}
    </Box>
  );
}
