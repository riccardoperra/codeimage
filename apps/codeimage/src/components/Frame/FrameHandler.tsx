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

type FrameHandlerProps = WithRef<'div'>;

export function FrameHandler(
  props: PropsWithChildren<FrameHandlerProps>,
): JSXElement {
  const [internalRef, setInternalRef] = createSignal<HTMLDivElement>();
  const [canvasScale, setCanvasScale] = createSignal(1);
  const ratio = 0.1;

  createEffect(
    on([internalRef], ([frame]) => {
      setTimeout(() => {
        const scale = getScaleByRatio(
          // TODO: should be a ref (?)
          frame?.parentElement,
          frame,
          1 + ratio,
        );
        setCanvasScale(scale);
      });
    }),
  );

  return (
    <div class={styles.wrapper}>
      <div
        class={styles.handler}
        style={assignInlineVars({
          [styles.frameHandlerVars.scale]: canvasScale().toString(),
        })}
        ref={createRef<'div'>(props, e => {
          setInternalRef(() => e);
        })}
      >
        {props.children}
      </div>
    </div>
  );
}
