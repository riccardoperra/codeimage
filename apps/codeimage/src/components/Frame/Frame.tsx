import {Component} from 'solid-js';
import * as styles from './Frame.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createHorizontalResize} from '../../core/hooks/resizable';
import {exportExclude as _exportExclude} from '../../core/directives/exportExclude';
import {Box} from '../ui/Box/Box';
import {FadeInOutTransition} from '../ui/Transition/Transition';

export const exportExclude = _exportExclude;

export const Frame: Component<{
  background: string | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
}> = props => {
  const {width, onResizeStart, setRef, resizing} = createHorizontalResize();
  const pxWidth = () => `${width() || '730'}px`;
  const roundedWidth = () => `${Math.floor(width())}px`;

  return (
    <Box position={'relative'}>
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
            [styles.frameVars.backgroundColor]:
              props.background ?? 'transparent',
            [styles.frameVars.opacity]: `${props.opacity}%`,
            [styles.frameVars.visibility]: `${
              props.visible ? 'visible' : 'hidden'
            }`,
          })}
        />

        <div class={styles.dragControls} use:exportExclude={true}>
          <div class={styles.dragControlLeft} onMouseDown={onResizeStart} />
          <div class={styles.dragControlRight} onMouseDown={onResizeStart} />
        </div>
        {props.children}
      </div>

      <FadeInOutTransition show={resizing()}>
        <Box class={styles.resizeLine} use:exportExclude={true}>
          <Box class={styles.resizeBadge}>{roundedWidth()}</Box>
          <hr class={styles.resizeLineDivider} />
        </Box>
      </FadeInOutTransition>
    </Box>
  );
};
