import {Box, FadeInOutTransition} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {useModality} from '@core/hooks/isMobile';
import {createHorizontalResize} from '@core/hooks/resizable';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent, Show} from 'solid-js';
import * as styles from './Frame.css';

export const exportExclude = _exportExclude;

export const Frame: ParentComponent<{
  background: string | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
  readOnly: boolean;
}> = props => {
  const {width, onResizeStart, setRef, resizing} = createHorizontalResize({
    minWidth: 600,
    maxWidth: 1400,
  });

  const computedWidth = () => {
    const size = width();
    return size ? `${size}px` : 'auto';
  };

  const roundedWidth = () => `${Math.floor(width())}px`;
  const modality = useModality();

  return (
    <Box position={'relative'} class={styles.wrapper}>
      <div
        ref={setRef}
        class={styles.container}
        style={assignInlineVars({
          [styles.frameVars.width]: computedWidth(),
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

        <Show when={modality === 'full' && !props.readOnly}>
          <div class={styles.dragControls} use:exportExclude={true}>
            <div class={styles.dragControlLeft} onMouseDown={onResizeStart} />
            <div class={styles.dragControlRight} onMouseDown={onResizeStart} />
          </div>
        </Show>

        {props.children}
      </div>

      <FadeInOutTransition show={resizing()}>
        <Box
          class={styles.resizeLine}
          ref={el => exportExclude(el, () => true)}
        >
          <Box class={styles.resizeBadge}>{roundedWidth()}</Box>
          <hr class={styles.resizeLineDivider} />
        </Box>
      </FadeInOutTransition>
    </Box>
  );
};
