import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {RangeField} from '@codeimage/ui';
import {SegmentedControl, SegmentedControlItem} from '@codeui/kit';
import {getUmami} from '@core/constants/umami';
import {SkeletonLine, SkeletonVCenter} from '@ui/Skeleton/Skeleton';
import {For, ParentComponent, Show} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {AppLocaleEntries} from '../../i18n';
import {AspectRatioPicker} from './controls/AspectRatioPicker/AspectRatioPicker';
import {CustomColorPicker} from './controls/CustomColorPicker';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const FrameStyleForm: ParentComponent = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editorPadding, editorRadius} = appEnvironment;
  const frame = getFrameState();

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow for={'paddingField'} label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedControl
              value={String(frame.store.padding)}
              onChange={value => frame.setPadding(Number(value))}
              size={'xs'}
              fluid
              id={'paddingField'}
              autoWidth
            >
              <For each={editorPadding}>
                {editorPadding => (
                  <SegmentedControlItem value={String(editorPadding)}>
                    {editorPadding}
                  </SegmentedControlItem>
                )}
              </For>
            </SegmentedControl>
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'radiusField'} label={t('frame.radius')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedControl
              value={String(frame.store.radius)}
              onChange={value => frame.setRadius(Number(value))}
              size={'xs'}
              fluid
              id={'radiusField'}
              autoWidth
            >
              <For each={editorRadius}>
                {editorRadius => (
                  <SegmentedControlItem value={String(editorRadius.value)}>
                    {editorRadius.label}
                  </SegmentedControlItem>
                )}
              </For>
            </SegmentedControl>
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'visibleField'} label={t('frame.visible')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedControl
              value={frame.store.visible ? 'y' : 'n'}
              onChange={value => frame.setVisibility(value === 'y')}
              size={'xs'}
              fluid
              id={'radiusField'}
              autoWidth
            >
              <SegmentedControlItem value={'y'}>
                {t('common.yes')}
              </SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                {t('common.no')}
              </SegmentedControlItem>
            </SegmentedControl>
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

      <PanelRow for={'aspectRatio'} label={t('frame.aspectRatio')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <AspectRatioPicker
              value={frame.store.aspectRatio}
              onChange={ratio => {
                frame.setAspectRatio(ratio);
                getUmami().trackEvent(ratio ?? 'auto', 'aspect-ratio');
              }}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
