import {focusedEditor$} from '@codeimage/store/editor';
import {Box, useSnackbarStore} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {WithRef} from 'solid-headless/dist/types/utils/dynamic-prop';
import {
  createEffect,
  createSignal,
  from,
  JSXElement,
  on,
  PropsWithChildren,
} from 'solid-js';
import {exportExclude as _exportExclude} from '../../core/directives/exportExclude';
import {createRef} from '../../core/helpers/create-ref';
import {getScaleByRatio} from '../../core/helpers/getScale';
import {useModality} from '../../core/hooks/isMobile';
import {
  ExportExtension,
  ExportMode,
  useExportImage,
} from '../../hooks/use-export-image';
import {useHotkey} from '../../hooks/use-hotkey';
import * as styles from './Frame.css';

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
  const snackbarStore = useSnackbarStore();

  const focusedEditor = from(focusedEditor$);

  const filterHotKey = () =>
    focusedEditor() || document.activeElement?.nodeName === 'INPUT';

  const ratio = 0.1;

  const [data, notify] = useExportImage();

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

  useHotkey(window, {
    'Control+C': () => {
      if (filterHotKey()) return;
      if (data.loading) return;
      const el = ref();
      if (!el) return;
      notify({
        ref: el,
        options: {
          extension: ExportExtension.png,
          pixelRatio: Math.floor(window.devicePixelRatio),
          mode: ExportMode.getBlob,
          quality: 100,
        },
      });
    },
  });

  createEffect(
    on(data, blob => {
      if (blob instanceof Blob) {
        navigator.clipboard
          .write([
            new ClipboardItem(
              {
                [blob.type]: blob,
              },
              {presentationStyle: 'attachment'},
            ),
          ])
          .then(() =>
            snackbarStore.create({
              closeable: true,
              message: 'Image copied to clipboard',
            }),
          );
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
