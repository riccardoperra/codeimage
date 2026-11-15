import {useI18n} from '@codeimage/locale';
import {getWhatsNew} from '../../state/whats-new';
import {getFrameState} from '@codeimage/store/editor/frame';
import {createSignature, SIGNATURE_STYLES} from '@codeimage/store/frame/model';
import type {FrameSignature} from '@codeimage/store/frame/model';
import {RangeField} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine, SkeletonVCenter} from '@ui/Skeleton/Skeleton';
import type {ParentComponent} from 'solid-js';
import {Show} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import type {AppLocaleEntries} from '../../i18n';
import {AspectRatioPicker} from './controls/AspectRatioPicker/AspectRatioPicker';
import {CustomColorPicker} from './controls/ColorPicker/CustomColorPicker';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';
import {Select, TextField, createSelectOptions} from '@codeui/kit';

export const FrameStyleForm: ParentComponent = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editorPadding, editorRadius} = appEnvironment;
  const frame = getFrameState();
  const changeHandle = (handle: string) => {
    if (handle.trim()) getWhatsNew().seen('signature');
    frame.setSignature(
      handle
        ? {...(frame.store.signature ?? createSignature(handle)), handle}
        : null,
    );
  };
  const changePosition = (position: FrameSignature['position']) => {
    const signature = frame.store.signature;
    if (signature) {
      frame.setSignature({...signature, position});
      getWhatsNew().seen('signature');
    }
  };
  const changeStyle = (style: FrameSignature['style']) => {
    const signature = frame.store.signature;
    if (signature) {
      frame.setSignature({...signature, style});
      getWhatsNew().seen('signature');
    }
  };

  const paddingOptions = createSelectOptions(
    editorPadding.map(padding => ({
      label: padding.label,
      value: padding.value,
    })),
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow for={'paddingField'} label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            {/* @ts-expect-error Fix @codeui/kit types */}
            <Select
              disallowEmptySelection
              {...paddingOptions.props()}
              {...paddingOptions.controlled(
                () => String(frame.store.padding),
                padding => {
                  if (typeof padding === 'undefined') {
                    return;
                  }
                  frame.setPadding(Number(padding));
                },
              )}
              options={paddingOptions.options()}
              aria-label={'Padding'}
              id={'paddingField'}
              size={'xs'}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'radiusField'} label={t('frame.radius')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedField
              adapt
              id={'radiusField'}
              size={'xs'}
              value={frame.store.radius}
              onChange={frame.setRadius}
              items={editorRadius.map(padding => ({
                label: padding.label,
                value: padding.value,
              }))}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'visibleField'} label={t('frame.visible')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedField
              adapt
              id={'visibleField'}
              size={'xs'}
              value={frame.store.visible}
              onChange={frame.setVisibility}
              items={[
                {label: t('common.yes'), value: true},
                {label: t('common.no'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.store.visible}>
        <PanelRow for={'opacityField'} label={t('frame.opacity')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={
                <SkeletonVCenter>
                  <SkeletonLine width={'100%'} height={'24px'} />
                </SkeletonVCenter>
              }
            >
              <RangeField
                id={'opacityField'}
                value={frame.store.opacity}
                min={0}
                disabled={!frame.store.visible}
                max={100}
                onChange={frame.setOpacity}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <Show when={frame.store.visible}>
        <PanelRow for={'colorField'} label={t('frame.background')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'26px'} />}
            >
              <CustomColorPicker
                onChange={frame.setBackground}
                value={frame.store.background ?? ''}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for="signatureHandle-input" label={t('frame.signature')}>
        <TwoColumnPanelRow>
          <TextField
            id="signatureHandle"
            size="xs"
            placeholder="@handle"
            value={frame.store.signature?.handle ?? ''}
            onChange={changeHandle}
          />
        </TwoColumnPanelRow>
      </PanelRow>
      <Show when={frame.store.signature}>
        <PanelRow for="signaturePosition" label={t('frame.signaturePosition')}>
          <FullWidthPanelRow>
            <SegmentedField
              id="signaturePosition"
              size="xs"
              adapt
              value={frame.store.signature?.position ?? 'bottom-right'}
              onChange={changePosition}
              items={[
                {label: t('signature.left'), value: 'bottom-left' as const},
                {label: t('signature.center'), value: 'bottom-center' as const},
                {label: t('signature.right'), value: 'bottom-right' as const},
              ]}
            />
          </FullWidthPanelRow>
        </PanelRow>
        <PanelRow for="signatureStyle" label={t('signature.style')}>
          <FullWidthPanelRow>
            <SegmentedField
              id="signatureStyle"
              size="xs"
              adapt
              value={frame.store.signature?.style ?? 'minimal'}
              onChange={changeStyle}
              items={SIGNATURE_STYLES.map(style => ({
                label: t(`signature.${style}`),
                value: style,
              }))}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'aspectRatio'} label={t('frame.aspectRatio')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <AspectRatioPicker
              target={frame.exportTarget()}
              onTargetChange={target => {
                frame.setExportTarget(target);
                getWhatsNew().seen('social');
              }}
              value={frame.store.aspectRatio}
              onChange={ratio => {
                frame.setAspectRatio(ratio);
                getUmami().track('aspect-ratio', {ratio: ratio ?? 'unset'});
              }}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
