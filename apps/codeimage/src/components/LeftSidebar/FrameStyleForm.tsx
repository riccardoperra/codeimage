import {PanelHeader} from './PanelHeader';
import {PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {JSXElement, Show} from 'solid-js';
import {RangeField} from '../ui/RangeField/RangeField';
import {ColorPicker} from '../ui/ColorPicker/ColorPicker';
import {useFrameState} from '../../state/frame';
import {useI18n} from '@codeimage/locale';
import {locale} from './FrameSidebar.locale';

export default function FrameStyleForm(): JSXElement {
  const frame = useFrameState();
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
            onChange={frame.setPadding}
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
            onChange={frame.setVisibility}
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
              onChange={frame.setOpacity}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <Show when={frame.visible}>
        <PanelRow label={t('frame.color')}>
          <TwoColumnPanelRow>
            <ColorPicker
              onChange={frame.setBackground}
              value={frame.background ?? undefined}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>
    </>
  );
}
