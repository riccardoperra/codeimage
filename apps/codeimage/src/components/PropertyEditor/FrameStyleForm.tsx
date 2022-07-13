import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/frame/createFrame';
import {RangeField, SegmentedField} from '@codeimage/ui';
import {ParentComponent, Show} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {AppLocaleEntries} from '../../i18n';
import {CustomColorPicker} from './controls/CustomColorPicker';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';

export const FrameStyleForm: ParentComponent = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editorPadding} = appEnvironment;
  const frame = getFrameState();

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow for={'paddingField'} label={t('frame.padding')}>
        <TwoColumnPanelRow>
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
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'visibleField'} label={t('frame.visible')}>
        <TwoColumnPanelRow>
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
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.store.visible}>
        <PanelRow for={'opacityField'} label={t('frame.opacity')}>
          <TwoColumnPanelRow>
            <RangeField
              id={'opacityField'}
              value={frame.store.opacity}
              min={0}
              disabled={!frame.store.visible}
              max={100}
              onChange={frame.setOpacity}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <Show when={frame.store.visible}>
        <PanelRow for={'colorField'} label={t('frame.color')}>
          <TwoColumnPanelRow>
            <CustomColorPicker
              title={'Color'}
              onChange={color => frame.setBackground(color)}
              value={frame.store.background ?? ''}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
};
