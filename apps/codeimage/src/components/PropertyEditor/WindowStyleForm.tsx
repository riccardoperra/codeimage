import {useI18n} from '@codeimage/locale';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {VersionStore} from '@codeimage/store/version/version.store';
import {createSelectOptions, Select} from '@codeui/kit';
import {shadowsLabel} from '@core/configuration/shadow';
import {getUmami} from '@core/constants/umami';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createMemo, ParentComponent, Show} from 'solid-js';
import {provideState} from 'statebuilder';
import {AppLocaleEntries} from '../../i18n';
import {TerminalControlField} from './controls/TerminalControlField/TerminalControlField';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const WindowStyleForm: ParentComponent = () => {
  const terminal = getTerminalState();
  const versionStore = provideState(VersionStore);
  const [t] = useI18n<AppLocaleEntries>();

  const terminalShadows = createMemo(
    () => shadowsLabel() as {label: string; value: string}[],
  );

  const terminalShadowsSelect = createSelectOptions(terminalShadows(), {
    key: 'label',
    valueKey: 'value',
  });

  const borderTypeSelect = createSelectOptions(
    [
      {label: 'None', value: 'none'},
      {label: 'Glass', value: 'glass'},
    ],
    {
      key: 'label',
      valueKey: 'value',
    },
  );

  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow for={'frameAlternativeField'} label={t('frame.backgroundType')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.alternativeTheme}
              onChange={terminal.setAlternativeTheme}
              items={[
                {label: 'Default', value: false},
                {label: 'Alternative', value: true},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameHeaderField'} label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              id={'frameHeaderInput'}
              value={terminal.state.showHeader}
              onChange={terminal.setShowHeader}
              items={[
                {label: t('common.yes'), value: true},
                {label: t('common.no'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <Show when={terminal.state.showHeader}>
        <PanelRow
          for={'frameTerminalTypeField'}
          label={'Window'}
          feature={'windowStylePicker'}
        >
          <FullWidthPanelRow>
            <TerminalControlField
              showAccent={terminal.state.accentVisible}
              selectedTerminal={terminal.state.type}
              onTerminalChange={type => {
                terminal.setType(type);
                getUmami().track('change-terminal-type', {
                  type,
                });
              }}
              onShowAccentChange={terminal.setAccentVisible}
            />
          </FullWidthPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameTabReflectionField'} label={t('frame.reflection')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.showGlassReflection}
              onChange={terminal.setShowGlassReflection}
              items={[
                {label: t('common.show'), value: true},
                {label: t('common.hide'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameShowWatermarkField'} label={t('frame.watermark')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
              adapt
              value={terminal.state.showWatermark}
              onChange={terminal.setShowWatermark}
              items={[
                {label: t('common.show'), value: true},
                {label: t('common.hide'), value: false},
              ]}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
      <PanelRow for={'frameSelectShadow'} label={t('frame.shadow')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            {/*@ts-expect-error Fix @codeui/kit select types*/}
            <Select
              options={terminalShadowsSelect.options()}
              multiple={false}
              {...terminalShadowsSelect.props()}
              {...terminalShadowsSelect.controlled(
                () => terminal.state.shadow ?? undefined,
                shadow => {
                  getUmami().track('change-shadow', {
                    shadow: shadow ?? 'none',
                  });
                  terminal.setShadow(shadow ?? null);
                },
              )}
              aria-label={'Shadow'}
              size={'xs'}
              id={'frameSelectShadow'}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
      <PanelRow
        for={'frameSelectShadow'}
        feature={'borderType'}
        label={t('frame.border')}
      >
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            {/*@ts-expect-error Fix @codeui/kit select types*/}
            <Select
              options={borderTypeSelect.options()}
              {...borderTypeSelect.props()}
              {...borderTypeSelect.controlled(
                () => terminal.state.borderType ?? 'none',
                border => {
                  const isNone = border === 'none';
                  versionStore.see('borderType', false);
                  getUmami().track('change-border', {
                    border: border ?? 'none',
                  });
                  terminal.setBorder(isNone ? null : border ?? null);
                },
              )}
              aria-label={'Border'}
              size={'xs'}
              id={'frameSelectBorder'}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
