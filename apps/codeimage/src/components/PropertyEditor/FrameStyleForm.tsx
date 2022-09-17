import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {RangeField, SegmentedField} from '@codeimage/ui';
import {SkeletonLine, SkeletonVCenter} from '@ui/Skeleton/Skeleton';
import {ParentComponent, Show} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {AppLocaleEntries} from '../../i18n';
import {CustomColorPicker} from './controls/CustomColorPicker';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const FrameStyleForm: ParentComponent = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editorPadding} = appEnvironment;
  const frame = getFrameState();

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow for={'paddingField'} label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'26px'} />}
          >
            <SegmentedField
              id={'paddingField'}
              size={'xs'}
              value={frame.store.padding}
              onChange={frame.setPadding}
              items={editorPadding.map(padding => ({
                label: padding.toString(),
                value: padding,
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
        <PanelRow for={'colorField'} label={t('frame.color')}>
          <TwoColumnPanelRow>
            <SuspenseEditorItem
              fallback={<SkeletonLine width={'100%'} height={'26px'} />}
            >
              <CustomColorPicker
                title={'Color'}
                onChange={color => frame.setBackground(color)}
                value={frame.store.background ?? ''}
              />
            </SuspenseEditorItem>
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
};
