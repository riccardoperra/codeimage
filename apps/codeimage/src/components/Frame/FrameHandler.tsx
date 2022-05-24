import {focusedEditor$} from '@codeimage/store/editor';
import {onCopyToClipboard} from '@codeimage/store/effects/onCopyToClipboard';
import {Box} from '@codeimage/ui';
import {dispatch} from '@ngneat/effects';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {
  createEffect,
  createSignal,
  from,
  JSXElement,
  on,
  ParentProps,
} from 'solid-js';
import {exportExclude as _exportExclude} from '../../core/directives/exportExclude';
import {createRef} from '../../core/helpers/create-ref';
import {getScaleByRatio} from '../../core/helpers/getScale';
import {useModality} from '../../core/hooks/isMobile';
import {useHotkey} from '../../hooks/use-hotkey';
import * as styles from './Frame.css';

const exportExclude = _exportExclude;

type FrameHandlerProps = WithRef<'div'> & {
  onScaleChange: (scale: number) => void;
};

export function FrameHandler(
  props: ParentProps<FrameHandlerProps>,
): JSXElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ref, setInternalRef] = createSignal<HTMLDivElement>();
  const [handlerRef, setHandlerRef] = createSignal<HTMLDivElement>();
  const [canvasScale, setCanvasScale] = createSignal(1);

  const modality = useModality();

  const focusedEditor = from(focusedEditor$);

  const filterHotKey = () =>
    focusedEditor() || document.activeElement?.nodeName === 'INPUT';

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

  useHotkey(document.body, {
    'Control+C': () => {
      if (filterHotKey()) return;
      const el = ref();
      if (!el) return;
      dispatch(onCopyToClipboard({ref: el}));
    },
  });

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
