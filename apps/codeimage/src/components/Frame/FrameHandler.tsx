import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {
  createEffect,
  createSignal,
  JSXElement,
  on,
  PropsWithChildren,
} from 'solid-js';
import {getScaleByRatio} from '../../core/helpers/getScale';
import * as styles from './Frame.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createRef} from '../../core/helpers/create-ref';
import {Box} from '../../ui/Box/Box';
import {exportExclude as _exportExclude} from '../../core/directives/exportExclude';
import {useModality} from '../../core/hooks/isMobile';

const exportExclude = _exportExclude;

type FrameHandlerProps = WithRef<'div'> & {
  onScaleChange: (scale: number) => void;
};

export function FrameHandler(
  props: PropsWithChildren<FrameHandlerProps>,
): JSXElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ref, setInternalRef] = createSignal<HTMLDivElement>();
  const [handlerRef, setHandlerRef] = createSignal<HTMLDivElement>();
  const [canvasScale, setCanvasScale] = createSignal(1);
  const modality = useModality();
  const ratio = 0.1;

  createEffect(
    on([handlerRef], ([frame]) => {
      if (modality === 'mobile') {
        setTimeout(() => {
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
          modality === 'full'
            ? {}
            : assignInlineVars({
                [styles.frameHandlerVars.scale]: canvasScale().toString(),
              })
        }
        ref={setHandlerRef}
      >
        <div
          class={styles.content}
          ref={createRef<'div'>(props, e => {
            setInternalRef(() => e);
          })}
        >
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
