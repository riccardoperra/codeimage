import {useI18n} from '@codeimage/locale';
import {
  setAccentVisible,
  setOpacity,
  setShowGlassReflection,
  setShowHeader,
  setShowWatermark,
  setType,
  terminal$,
} from '@codeimage/store/terminal';
import {RangeField, SegmentedField} from '@codeimage/ui';
import {ParentComponent, Show} from 'solid-js';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {AppLocaleEntries} from '../../i18n';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';

export const WindowStyleForm: ParentComponent = () => {
  const terminal = fromObservableObject(terminal$);
  const [t] = useI18n<AppLocaleEntries>();

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
              {label: t('common.yes'), value: true},
              {label: t('common.no'), value: false},
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
            value={terminal.showGlassReflection}
            onChange={setShowGlassReflection}
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
            value={terminal.showWatermark}
            onChange={setShowWatermark}
            items={[
              {label: t('common.show'), value: true},
              {label: t('common.hide'), value: false},
            ]}
          />
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameOpacityField'} label={t('frame.opacity')}>
        <TwoColumnPanelRow>
          <RangeField
            size={'xs'}
            value={terminal.opacity}
            onChange={setOpacity}
          />
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
