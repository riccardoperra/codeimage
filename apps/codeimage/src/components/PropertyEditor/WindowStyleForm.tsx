import {useI18n} from '@codeimage/locale';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Box, Group, RadioBlock, SegmentedField} from '@codeimage/ui';
import {Select} from '@codeui/kit';
import {shadowsLabel} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {createMemo, For, ParentComponent, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {TerminalControlField} from '../TerminalControlField/TerminalControlField';
import {TerminalControlSkeleton} from '../TerminalControlField/TerminalControlFieldSkeleton';
import {PanelHeader} from './PanelHeader';
import {FullWidthPanelRow, PanelRow, TwoColumnPanelRow} from './PanelRow';
import {SuspenseEditorItem} from './SuspenseEditorItem';

export const WindowStyleForm: ParentComponent = () => {
  const terminal = getTerminalState();
  const [t] = useI18n<AppLocaleEntries>();
  const terminalShadows = createMemo(shadowsLabel);
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
        <PanelRow for={'frameTerminalTypeField'}>
          <FullWidthPanelRow>
            <SuspenseEditorItem
              fallback={
                <Group orientation={'vertical'}>
                  <For each={Object.values(AVAILABLE_TERMINAL_THEMES.entries)}>
                    {() => (
                      <RadioBlock value={0}>
                        <Box padding={2} width={'100%'}>
                          <TerminalControlSkeleton />
                        </Box>
                      </RadioBlock>
                    )}
                  </For>
                </Group>
              }
            >
              <TerminalControlField
                selectedTerminal={terminal.state.type}
                onTerminalChange={terminal.setType}
              />
            </SuspenseEditorItem>
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
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedField
              size={'xs'}
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
            <Select
              aria-label={'Shadow'}
              size={'xs'}
              id={'frameSelectShadow'}
              options={terminalShadows()}
              itemLabel={props => props.label}
              optionTextValue={'label'}
              optionValue={'value'}
              valueComponent={props => props.item.rawValue.label}
              value={terminal.state.shadow ?? undefined}
              onValueChange={value => {
                getUmami().trackEvent(value ?? 'none', 'change-shadow');
                terminal.setShadow(value);
              }}
            />
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
    </>
  );
};
