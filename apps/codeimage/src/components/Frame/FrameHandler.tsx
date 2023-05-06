import {Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {getScaleByRatio} from '@core/helpers/getScale';
import {useModality} from '@core/hooks/isMobile';
import {type WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {
  createEffect,
  createSignal,
  JSXElement,
  on,
  ParentProps,
} from 'solid-js';
import * as styles from './FrameHandler.css';

const exportExclude = _exportExclude;

type FrameHandlerProps = WithRef<'div'> & {
  onScaleChange: (scale: number) => void;
};

export function FrameHandler(
  props: ParentProps<FrameHandlerProps>,
): JSXElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [handlerRef, setHandlerRef] = createSignal<HTMLDivElement>();
  const [canvasScale, setCanvasScale] = createSignal(1);

  const modality = useModality();

  const ratio = 0.1;

  createEffect(
    on([handlerRef], ([frame]) => {
      if (modality === 'mobile') {
        requestAnimationFrame(() => {
          const scale = getScaleByRatio(frame?.parentElement, frame, 1 + ratio);
          props.onScaleChange(scale);
          setCanvasScale(scale);
        });
      }
    }),
  );

  return (
    <Box class={styles.wrapper}>
      <div
        class={styles.handler}
        style={
          // ATTENTION: this is needed to fix autocomplete bug on desktop due to translate. https://github.com/riccardoperra/codeimage/issues/42
          modality === 'full' ? {} : {transform: `scale(${canvasScale()})`}
        }
        ref={setHandlerRef}
      >
        <div class={styles.content}>
          <div
            use:exportExclude={true}
            class={styles.squaredBackgroundOverlay}
          />
          {props.children}
        </div>
      </div>
    </Box>
  );
}
