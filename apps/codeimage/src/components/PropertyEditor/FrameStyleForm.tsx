import {useI18n} from '@codeimage/locale';
import {
  frame$,
  setBackground,
  setOpacity,
  setVisibility,
} from '@codeimage/store/frame';
import {ColorPicker, RangeField, SegmentedField} from '@codeimage/ui';
import {Show} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {AppLocaleEntries} from '../../i18n';
import {setPadding} from '../../state/frame';
import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';

export const FrameStyleForm = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const {editorPadding} = appEnvironment;
  const frame = fromObservableObject(frame$);

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow for={'paddingField'} label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SegmentedField
            id={'paddingField'}
            size={'xs'}
            value={frame.padding}
            onChange={setPadding}
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
            value={frame.visible}
            onChange={setVisibility}
            items={[
              {label: t('common.yes'), value: true},
              {label: t('common.no'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.visible}>
        <PanelRow for={'opacityField'} label={t('frame.opacity')}>
          <TwoColumnPanelRow>
            <RangeField
              id={'opacityField'}
              value={frame.opacity}
              min={0}
              disabled={!frame.visible}
              max={100}
              onChange={setOpacity}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <Show when={frame.visible}>
        <PanelRow for={'colorField'} label={t('frame.color')}>
          <TwoColumnPanelRow>
            <ColorPicker
              id={'colorField'}
              title={'Color'}
              onChange={setBackground}
              value={frame.background ?? ''}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
};
