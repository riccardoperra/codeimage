import {
  AssetId,
  getAssetsStore,
  isAssetUrl,
} from '@codeimage/store/assets/assets';
import {Box, FadeInOutTransition} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {useModality} from '@core/hooks/isMobile';
import {createHorizontalResize} from '@core/hooks/resizable';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent, Show} from 'solid-js';
import * as styles from './Frame.css';

export const exportExclude = _exportExclude;

export const Frame: ParentComponent<{
  background: string | AssetId | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
  readOnly: boolean;
}> = props => {
  const {width, onResizeStart, setRef, resizing} = createHorizontalResize({
    minWidth: 200,
    maxWidth: 1400,
  });

  const assetsStore = getAssetsStore();

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
        })}
      >
        <Show when={isAssetUrl(props.background) && props.background}>
          {assetId => (
            <img
              width={'100%'}
              height={'100%'}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                'object-fit': 'cover',
              }}
              src={assetsStore.getAsset(assetId())()?.url}
              alt={'Frame background'}
            />
          )}
        </Show>

        <div
          data-frame-content
          class={styles.overlay}
          style={assignInlineVars({
            [styles.frameVars.backgroundColor]: props.background?.startsWith(
              'image:',
            )
              ? 'transparent'
              : props.background ?? 'transparent',
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
