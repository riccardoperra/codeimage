import {Component, createMemo} from 'solid-js';
import * as styles from './Frame.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createHorizontalResize} from '../../core/hooks/resizable';

export const Frame: Component<{
  background: string | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
}> = props => {
  const {width, onResizeStart, setRef} = createHorizontalResize();
  const pxWidth = createMemo(() => `${width()}px`);

  return (
    <div
      ref={setRef}
      class={styles.container}
      style={assignInlineVars({
        [styles.frameVars.width]: pxWidth(),
        [styles.frameVars.padding]: `${props.padding}px`,
        [styles.frameVars.radius]: `${props.radius}px`,
      })}
    >
      <div
        class={styles.overlay}
        style={assignInlineVars({
          [styles.frameVars.backgroundColor]: props.background ?? 'transparent',
          [styles.frameVars.opacity]: `${props.opacity}%`,
          [styles.frameVars.visibility]: `${
            props.visible ? 'visible' : 'hidden'
          }`,
        })}
      />

      <div class={styles.dragControls}>
        <div class={styles.dragControlLeft} onMouseDown={onResizeStart} />
        <div class={styles.dragControlRight} onMouseDown={onResizeStart} />
      </div>
      {props.children}
    </div>
  );
};
