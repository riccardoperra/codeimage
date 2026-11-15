import {createFrameMedia} from './frameMedia';
import type {getExportTarget} from '@codeimage/config';
import type {FrameState} from '@codeimage/store/frame/model';
import {FittedWindow} from './FittedWindow';
import {FrameSignature, framePadding, signatureScale} from './FrameSignature';
import type {AssetId} from '@codeimage/store/assets/assets';
import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {AssetsImage} from '@codeimage/store/assets/AssetsImage';
import {getRootEditorStore} from '@codeimage/store/editor';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {Box, FadeInOutTransition} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {useModality} from '@core/hooks/isMobile';
import {createHorizontalResize} from '@core/hooks/resizable';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentComponent} from 'solid-js';
import {onMount, Show} from 'solid-js';
import {useI18n} from '@codeimage/locale';
import {signatureEditor} from '@codeimage/store/frame/signatureEditor';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './Frame.css';

export const exportExclude = _exportExclude;

interface FrameProps {
  background: string | AssetId | null | undefined;
  padding: number;
  radius: number;
  opacity: number;
  visible: boolean;
  readOnly: boolean;
  signature: FrameState['signature'];
  exportTarget?: ReturnType<typeof getExportTarget>;
  aspectRatio: string | null | undefined;
  /** The width the frame last measured, which sizes the signature. */
  measuredWidth?: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}

export const Frame: ParentComponent<FrameProps> = props => {
  const media = createFrameMedia(() => ({
    background: props.background ?? null,
    signature: props.signature,
  }));
  const [t] = useI18n<AppLocaleEntries>();
  const target = () => props.exportTarget;
  const targetWidth = () => Math.min(640, target()?.resolution[0] ?? 640);
  const targetScale = () => targetWidth() / (target()?.resolution[0] ?? 640);
  const {width, height, onResizeStart, setRef, resizing, ref, refresh} =
    createHorizontalResize({
      minWidth: 200,
      maxWidth: 1920,
      aspectRatio: () => {
        if (!props.aspectRatio || target()) return null;
        const [w, h] = props.aspectRatio.split('/').map(Number);
        return w / h;
      },
    });

  const assetsStore = getAssetsStore();
  const scale = () =>
    signatureScale(
      target()?.resolution[0] ?? (width() || props.measuredWidth || 0),
    );

  const computedWidth = () => {
    if (target()) return `${target()!.resolution[0]}px`;
    const size = width();
    return size ? `${size}px` : 'auto';
  };

  const computedHeight = () => {
    if (target()) return `${target()!.resolution[1]}px`;
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
        if (!target()) refresh();
      },
    );
  });

  const borderRadius = () => {
    const radius = props.radius;
    if (!radius) return '0';
    if (isNaN(props.radius)) return String(radius);
    return `${radius}px`;
  };

  return (
    <div
      style={{
        ...assignInlineVars({
          [styles.frameVars.radius]: borderRadius(),
          [styles.frameVars.aspectRatio]: 'unset',
        }),
        zoom: target() ? targetScale() : undefined,
      }}
      class={styles.wrapper}
    >
      <div
        ref={setRef}
        class={styles.container}
        style={assignInlineVars({
          [styles.frameVars.width]: computedWidth(),
          [styles.frameVars.height]: computedHeight(),
          [styles.frameVars.padding]: framePadding(
            props.padding,
            props.signature,
            scale(),
          ),
          [styles.frameVars.minWidth]: target() ? '0' : 'max-content',
          [styles.frameVars.minHeight]: target() ? '0' : '100%',
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
              : (props.background ?? 'transparent'),
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

        <Show when={modality === 'full' && !props.readOnly && !target()}>
          <div class={styles.dragControls} use:exportExclude={true}>
            <div class={styles.dragControlLeft} onMouseDown={onResizeStart} />
            <div class={styles.dragControlRight} onMouseDown={onResizeStart} />
          </div>
        </Show>

        <FittedWindow active={!!target()}>{props.children}</FittedWindow>
        <FrameSignature
          signature={props.signature}
          media={media()}
          background={props.background}
          scale={scale()}
          onEdit={
            !props.readOnly && signatureEditor.available()
              ? signatureEditor.open
              : undefined
          }
          editLabel={t('signature.edit')}
        />
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
