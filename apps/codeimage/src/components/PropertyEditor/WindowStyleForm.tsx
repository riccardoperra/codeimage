import {useI18n} from '@codeimage/locale';
import {setShowWatermark} from '@codeimage/store/terminal';
import {getTerminalState} from '@codeimage/store/terminal/createTerminal';
import {SegmentedField, Select} from '@codeimage/ui';
import {shadowsLabel, TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {useModality} from '@core/hooks/isMobile';
import {createMemo, ParentComponent, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';

export const WindowStyleForm: ParentComponent = () => {
  const terminal = getTerminalState();
  const [t] = useI18n<AppLocaleEntries>();
  const terminalShadows = createMemo(shadowsLabel);
  const modality = useModality();
  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow for={'frameAlternativeField'} label={t('frame.backgroundType')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.state.alternativeTheme}
            onChange={terminal.setAlternativeTheme}
            items={[
              {label: 'Default', value: false},
              {label: 'Alternative', value: true},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameHeaderField'} label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            id={'frameHeaderInput'}
            value={terminal.state.showHeader}
            onChange={terminal.setShowHeader}
            items={[
              {label: t('common.yes'), value: true},
              {label: t('common.no'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.state.showHeader}>
        <PanelRow for={'frameTerminalTypeField'}>
          <FullWidthPanelRow>
            <TerminalControlField
              selectedTerminal={terminal.state.type}
              onTerminalChange={terminal.setType}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <Show
        when={terminal.state.showHeader && !terminal.state.alternativeTheme}
      >
        <PanelRow for={'frameTabAccentField'} label={t('frame.tabAccent')}>
          <TwoColumnPanelRow>
            <SegmentedField
              size={'xs'}
              value={terminal.state.accentVisible}
              onChange={terminal.setAccentVisible}
              items={[
                {label: t('common.yes'), value: true},
                {label: t('common.no'), value: false},
              ]}
            />
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameTabReflectionField'} label={t('frame.reflection')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.state.showGlassReflection}
            onChange={terminal.setShowGlassReflection}
            items={[
              {label: t('common.show'), value: true},
              {label: t('common.hide'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameShowWatermarkField'} label={t('frame.watermark')}>
        <TwoColumnPanelRow>
          <SegmentedField
            size={'xs'}
            value={terminal.state.showWatermark}
            onChange={terminal.setShowWatermark}
            items={[
              {label: t('common.show'), value: true},
              {label: t('common.hide'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>
      <PanelRow for={'frameSelectShadow'} label={t('frame.shadow')}>
        <TwoColumnPanelRow>
          <Select
            id={'frameSelectShadow'}
            native={modality === 'mobile'}
            items={terminalShadows()}
            value={terminal.state.shadow}
            onSelectChange={value => {
              const shadowSelected = value ?? TERMINAL_SHADOWS.bottom;
              umami.trackEvent(shadowSelected, 'change-shadow');
              terminal.setShadow(shadowSelected);
            }}
          />
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
