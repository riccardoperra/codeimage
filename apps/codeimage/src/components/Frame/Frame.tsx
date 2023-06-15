import {
  AssetId,
  getAssetsStore,
  isAssetUrl,
} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getEditorStore, getRootEditorStore} from '@codeimage/store/editor';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {Box, FadeInOutTransition} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {useModality} from '@core/hooks/isMobile';
import {createHorizontalResize} from '@core/hooks/resizable';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {onMount, ParentComponent, Show, createEffect, on} from 'solid-js';
import * as styles from './Frame.css';

export const exportExclude = _exportExclude;

interface FrameProps {
  background: string | AssetId | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
  readOnly: boolean;
  aspectRatio: string | null | undefined;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}

export const Frame: ParentComponent<FrameProps> = props => {
  const {width, height, onResizeStart, setRef, resizing, ref, refresh} =
    createHorizontalResize({
      minWidth: 200,
      maxWidth: 1920,
      aspectRatio: () => {
        if (!props.aspectRatio) return null;
        const [w, h] = props.aspectRatio.split('/').map(Number);
        return w / h;
      },
    });

  const assetsStore = getAssetsStore();

  const computedWidth = () => {
    const size = width();
    return size ? `${size}px` : 'auto';
  };

  const computedHeight = () => {
    const size = height();
    return size ? `${size}px` : '100%';
  };

  const roundedWidth = () => `${Math.floor(width())}px`;
  const modality = useModality();

  createResizeObserver(ref, () => {
    setTimeout(() => {
      const refValue = ref();
      if (!refValue) return;
      const {clientWidth, clientHeight} = refValue;
      props.onWidthChange(clientWidth);
      props.onHeightChange(clientHeight);
    });
  });

  onMount(() => {
    const refValue = ref();
    if (!refValue) return;

    props.onWidthChange?.(refValue.clientWidth ?? 0);

    const preview = refValue.querySelector('[data-preview]');
    createResizeObserver(
      () => preview,
      () => {
        refresh();
      },
    );
  });

  createEffect(
    on(
      () => getEditorStore().editor.state.activeEditorId,
      () => refresh(),
    ),
  );

  return (
    <div
      style={assignInlineVars({
        [styles.frameVars.aspectRatio]: 'unset',
      })}
      class={styles.wrapper}
    >
      <div
        ref={setRef}
        class={styles.container}
        style={assignInlineVars({
          [styles.frameVars.width]: computedWidth(),
          [styles.frameVars.height]: computedHeight(),
          [styles.frameVars.padding]: `${props.padding}px`,
        })}
      >
        <div
          data-frame-content
          class={styles.overlay}
          style={assignInlineVars({
            [styles.frameVars.backgroundColor]: assetsStore.isAssetUrl(
              props.background,
            )
              ? 'transparent'
              : props.background ?? 'transparent',
            [styles.frameVars.opacity]: `${props.opacity}%`,
            [styles.frameVars.visibility]: `${
              props.visible ? 'visible' : 'hidden'
            }`,
          })}
        >
          <Show when={isAssetUrl(props.background) && props.background}>
            {assetId => (
              <AssetsImage
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  'object-fit': 'cover',
                }}
                onError={() => {
                  return dispatchUpdateTheme({
                    updateBackground: true,
                    theme: getRootEditorStore().state.options.themeId,
                  });
                }}
                assetId={assetId()}
              />
            )}
          </Show>
        </div>

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
    </div>
  );
};
