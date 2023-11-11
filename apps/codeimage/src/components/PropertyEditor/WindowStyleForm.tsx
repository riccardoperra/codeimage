import {useI18n} from '@codeimage/locale';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {Box, Group, RadioBlock} from '@codeimage/ui';
import {
  createSelectOptions,
  SegmentedControl,
  SegmentedControlItem,
  Select,
} from '@codeui/kit';
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

  const terminalShadows = createMemo(
    () => shadowsLabel() as {label: string; value: string}[],
  );

  const terminalShadowsSelect = createSelectOptions(terminalShadows(), {
    key: 'label',
    valueKey: 'value',
  });

  return (
    <>
      <PanelHeader label={t('frame.terminal')} />

      <PanelRow for={'frameAlternativeField'} label={t('frame.backgroundType')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedControl
              value={terminal.state.alternativeTheme ? 'y' : 'n'}
              onChange={value => terminal.setAlternativeTheme(value === 'y')}
              size={'xs'}
              fluid
              autoWidth
            >
              <SegmentedControlItem value={'y'}>Default</SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                Alternative
              </SegmentedControlItem>
            </SegmentedControl>
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameHeaderField'} label={t('frame.header')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedControl
              value={terminal.state.showHeader ? 'y' : 'n'}
              onChange={value => terminal.setShowHeader(value === 'y')}
              size={'xs'}
              fluid
              autoWidth
              id={'radiusField'}
            >
              <SegmentedControlItem value={'y'}>
                {t('common.yes')}
              </SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                {t('common.no')}
              </SegmentedControlItem>
            </SegmentedControl>
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
            <SegmentedControl
              value={terminal.state.accentVisible ? 'y' : 'n'}
              onChange={value => terminal.setAccentVisible(value === 'y')}
              size={'xs'}
              fluid
              autoWidth
              id={'radiusField'}
            >
              <SegmentedControlItem value={'y'}>
                {t('common.yes')}
              </SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                {t('common.no')}
              </SegmentedControlItem>
            </SegmentedControl>
          </TwoColumnPanelRow>
        </PanelRow>
      </Show>

      <PanelRow for={'frameTabReflectionField'} label={t('frame.reflection')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedControl
              value={terminal.state.showGlassReflection ? 'y' : 'n'}
              onChange={value => terminal.setShowGlassReflection(value === 'y')}
              size={'xs'}
              fluid
              autoWidth
              id={'radiusField'}
            >
              <SegmentedControlItem value={'y'}>
                {t('common.show')}
              </SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                {t('common.hide')}
              </SegmentedControlItem>
            </SegmentedControl>
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>

      <PanelRow for={'frameShowWatermarkField'} label={t('frame.watermark')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <SegmentedControl
              value={terminal.state.showWatermark ? 'y' : 'n'}
              onChange={value => terminal.setShowWatermark(value === 'y')}
              size={'xs'}
              fluid
              autoWidth
              id={'radiusField'}
            >
              <SegmentedControlItem value={'y'}>
                {t('common.show')}
              </SegmentedControlItem>
              <SegmentedControlItem value={'n'}>
                {t('common.hide')}
              </SegmentedControlItem>
            </SegmentedControl>
          </SuspenseEditorItem>
        </TwoColumnPanelRow>
      </PanelRow>
      <PanelRow for={'frameSelectShadow'} label={t('frame.shadow')}>
        <TwoColumnPanelRow>
          <SuspenseEditorItem
            fallback={<SkeletonLine width={'100%'} height={'24px'} />}
          >
            <Select
              options={terminalShadowsSelect.options()}
              {...terminalShadowsSelect.props()}
              {...terminalShadowsSelect.controlled(
                () => terminal.state.shadow ?? undefined,
                shadow => {
                  getUmami().trackEvent(shadow ?? 'none', 'change-shadow');
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
    </>
  );
};
