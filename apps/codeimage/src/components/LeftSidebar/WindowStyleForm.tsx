import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {Show} from 'solid-js';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {useI18n} from '@codeimage/locale';
import {
  setAccentVisible,
  setShowHeader,
  setShowWatermark,
  setType,
  terminal$,
} from '@codeimage/store/terminal';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import sidebarLocale from '../../i18n/sidebar';

export const WindowStyleForm = () => {
  const terminal = fromObservableObject(terminal$);
  const [t] = useI18n<typeof sidebarLocale>();

  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow for={'frameHeaderField'} label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            id={'frameHeaderInput'}
            value={terminal.showHeader}
            onChange={setShowHeader}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.showHeader}>
        <PanelRow for={'frameTerminalTypeField'}>
          <FullWidthPanelRow>
            <TerminalControlField
              selectedTerminal={terminal.type}
              onTerminalChange={setType}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <Show when={terminal.showHeader}>
        <PanelRow for={'frameTabAccentField'} label={t('frame.tabAccent')}>
          <TwoColumnPanelRow>
            <SegmentedField
              size={'xs'}
              value={terminal.accentVisible}
              onChange={setAccentVisible}
              items={[
                {label: 'Yes', value: true},
                {label: 'No', value: false},
              ]}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameShowWatermarkField'} label={t('frame.watermark')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.showWatermark}
            onChange={setShowWatermark}
            items={[
              {label: 'Show', value: true},
              {label: 'Hide', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      {/*// TODO: to refactor: handle light/dark mode, handle mobile view, add customizable shadows */}
      {/*<PanelRow label={t('frame.shadows')}>*/}
      {/*  <TwoColumnPanelRow>*/}
      {/*    <ShadowField value={terminal.shadow} onChange={terminal.setShadow} />*/}
      {/*  </TwoColumnPanelRow>*/}
      {/*</PanelRow>*/}
    </>
  );
};
