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
import {Box} from '../ui/Box/Box';
import {exportExclude as _exportExclude} from '../../core/directives/exportExclude';

const exportExclude = _exportExclude;

type FrameHandlerProps = WithRef<'div'> & {
  onScaleChange: (scale: number) => void;
};

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
        props.onScaleChange(scale);
        setCanvasScale(scale);
      });
    }),
  );

  return (
    <Box class={styles.wrapper}>
      <div
        class={styles.handler}
        style={assignInlineVars({
          [styles.frameHandlerVars.scale]: canvasScale().toString(),
        })}
        ref={createRef<'div'>(props, e => {
          setInternalRef(() => e);
        })}
      >
        <div use:exportExclude={true} class={styles.squaredBackgroundOverlay} />
        {props.children}
      </div>
    </Box>
  );
}
