import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {Show} from 'solid-js';
import {RangeField} from '../ui/RangeField/RangeField';
import {ColorPicker} from '../ui/ColorPicker/ColorPicker';
import {useI18n} from '@codeimage/locale';
import {locale} from './FrameSidebar.locale';
import {fromStore} from '@codeimage/store/from-store';
import {
  frame$,
  setBackground,
  setOpacity,
  setPadding,
  setVisibility,
} from '@codeimage/store/frame';

export const FrameStyleForm = () => {
  const frame = fromStore(frame$);
  const [t, {merge}] = useI18n<typeof locale>();
  merge(locale);

  return (
    <>
      <PanelHeader label={t('frame.frame')} />

      <PanelRow label={t('frame.padding')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={frame.padding}
            onChange={setPadding}
            items={[
              {label: '16', value: 16},
              {label: '32', value: 32},
              {label: '64', value: 64},
              {label: '128', value: 128},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow label={t('frame.visible')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={frame.visible}
            onChange={setVisibility}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={frame.visible}>
        <PanelRow label={t('frame.opacity')}>
          <TwoColumnPanelRow>
            <RangeField
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
        <PanelRow label={t('frame.color')}>
          <TwoColumnPanelRow>
            <ColorPicker
              onChange={setBackground}
              value={frame.background ?? undefined}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
};
