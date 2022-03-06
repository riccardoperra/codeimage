import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SegmentedField} from '../ui/SegmentedField/SegmentedField';
import {Show} from 'solid-js';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {useI18n} from '@codeimage/locale';
import {locale} from './FrameSidebar.locale';
import {useTerminalState} from '../../state/terminal';

export const WindowStyleForm = () => {
  const terminal = useTerminalState();
  const [t, {merge}] = useI18n<typeof locale>();
  merge(locale);

  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.showHeader}
            onChange={terminal.setShowHeader}
            items={[
              {label: 'Yes', value: true},
              {label: 'No', value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.showHeader}>
        <PanelRow>
          <FullWidthPanelRow>
            <TerminalControlField
              selectedTerminal={terminal.type}
              onTerminalChange={terminal.setType}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <Show when={terminal.showHeader}>
        <PanelRow label={t('frame.tabAccent')}>
          <TwoColumnPanelRow>
            <SegmentedField
              size={'xs'}
              value={terminal.accentVisible}
              onChange={terminal.setAccentVisible}
              items={[
                {label: 'Yes', value: true},
                {label: 'No', value: false},
              ]}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      {/*// TODO: to refactor: handle light/dark mode, handle mobile view, add customizable shadows */}
      {/*<PanelRow label={t('frame.shadows')}>*/}
      {/*  <TwoColumnPanelRow>*/}
      {/*    <ShadowField value={terminal.shadow} onChange={terminal.setShadow} />*/}
      {/*  </TwoColumnPanelRow>*/}
      {/*</PanelRow>*/}
    </>
  );
};
