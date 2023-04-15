import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getPresetsStore} from '@codeimage/store/presets/presets';
import {getUiStore} from '@codeimage/store/ui';
import {Box, HStack, Text} from '@codeimage/ui';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {getUmami} from '@core/constants/umami';
import {formatDistanceToNow} from '@core/helpers/date';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {As} from '@kobalte/core';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import clsx from 'clsx';
import {ErrorBoundary, For, ParentComponent, Show, Suspense} from 'solid-js';
import {AppLocaleEntries} from '../../../i18n';
import {CloseIcon} from '../../Icons/CloseIcon';
import {CloudIcon} from '../../Icons/CloudIcon';
import {DotHorizontalIcon} from '../../Icons/DotVertical';
import {PanelDivider} from '../../PropertyEditor/PanelDivider';
import {ThemeBoxSkeleton} from '../../ThemeSwitcher/ThemeBoxSkeleton';
import {ThemeSwitcherVariant} from '../../ThemeSwitcher/ThemeSwitcher.css';
import {EmptyPresetFallback} from '../EmptyPresetFallback/EmptyPresetFallback';
import {PresetPreview} from '../PresetPreview/PresetPreview';
import {PresetUpdateDialog} from '../PresetUpdateDialog';
import * as styles from './PresetSwitcher.css';

type PresetSwitcherProps = {
  onClose: () => void;
};

export const PresetSwitcher: ParentComponent<
  PresetSwitcherProps & ThemeSwitcherVariant
> = props => {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const frame = getFrameState();
  const [t] = useI18n<AppLocaleEntries>();
  const locale = () => getUiStore().get.locale;
  const presetsStore = getPresetsStore();

  const onSelectTheme = (data: ProjectEditorPersistedState) => {
    editor.actions.setFromPreset(data);
    frame.setFromPreset(data);
    terminal.setFromPreset(data);
    getUmami().trackEvent('preset', 'select-preset');
  };

  const exampleCode =
    'function Preview() {\n' +
    ' const [get, set] = \n' +
    '   createSignal(0);\n' +
    '}';

  const classes = () => clsx(styles.box);

  const openDialog = createControlledDialog();

  return (
    <Box class={classes()}>
      <div class={styles.fixedTitle}>
        <Box
          display={'flex'}
          justifyContent={'spaceBetween'}
          alignItems={'center'}
        >
          <Text weight={'semibold'}>{t('presets.userPresets')}</Text>
          <HStack spacing={2}>
            <Button
              size={'xs'}
              theme={'primary'}
              onClick={() => {
                openDialog(RenameContentDialog, {
                  title: t('presets.addPreset.confirmTitle'),
                  message: t('presets.addPreset.confirmMessage'),
                  onConfirm: async name => {
                    presetsStore.actions.addNewPreset({name});
                  },
                });
              }}
            >
              {t('presets.addPreset.label')}
            </Button>
            <IconButton
              aria-label={'Close'}
              size={'xs'}
              theme={'secondary'}
              onClick={props.onClose}
            >
              <CloseIcon />
            </IconButton>
          </HStack>
        </Box>
        <PanelDivider />
      </div>

      <div class={styles.grid({orientation: props.orientation})}>
        <Suspense
          fallback={
            <>
              <ThemeBoxSkeleton />
            </>
          }
        >
          <For
            each={presetsStore.sortedPresets()}
            fallback={<EmptyPresetFallback />}
          >
            {theme => {
              const data = () => theme.data as ProjectEditorPersistedState;
              const canSyncPreset = () =>
                presetsStore.bridge.canSyncPreset(theme);

              const lastUpdateDate = () => {
                return formatDistanceToNow(locale(), theme.updatedAt as string);
              };

              function openUpdateDialog() {
                openDialog(PresetUpdateDialog, {
                  currentPreset: theme.data,
                  onConfirm: async () => {
                    presetsStore.actions.updatePresetWithCurrentState({
                      preset: theme,
                    });
                  },
                });
              }

              return (
                <Suspense fallback={<ThemeBoxSkeleton />}>
                  <div>
                    <li
                      class={styles.item}
                      onClick={() => onSelectTheme(data())}
                    >
                      <ErrorBoundary fallback={<ThemeBoxSkeleton />}>
                        <PresetPreview code={exampleCode} data={data()} />
                      </ErrorBoundary>

                      <Box
                        display={'flex'}
                        justifyContent={'spaceBetween'}
                        marginTop={4}
                      >
                        <div>
                          <Text weight={'semibold'}>{theme.name}</Text>
                          <Box marginTop={2}>
                            <Text size={'xs'}>
                              {t('dashboard.updated')} {lastUpdateDate()}
                            </Text>
                          </Box>
                        </div>
                        <div
                          onClick={e => {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <As
                                component={IconButton}
                                aria-label={'Menu'}
                                theme={'secondary'}
                                size={'xs'}
                              >
                                <DotHorizontalIcon size={'md'} />
                              </As>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => openUpdateDialog()}
                                >
                                  {t('presets.updatePreset.label')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    openDialog(RenameContentDialog, {
                                      title: t(
                                        'presets.renamePreset.confirmTitle',
                                      ),
                                      message: t(
                                        'presets.renamePreset.confirmMessage',
                                      ),
                                      initialValue: theme.name,
                                      onConfirm: async newName => {
                                        presetsStore.actions.updatePresetName({
                                          preset: theme,
                                          newName,
                                        });
                                      },
                                    });
                                  }}
                                >
                                  {t('presets.renamePreset.label')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    openDialog(ConfirmDialog, {
                                      title: t(
                                        'presets.deletePreset.confirmTitle',
                                      ),
                                      message: t(
                                        'presets.deletePreset.confirmMessage',
                                      ),
                                      onConfirm: () => {
                                        presetsStore.actions.deletePreset(
                                          theme,
                                        );
                                      },
                                      actionType: 'danger' as const,
                                    });
                                  }}
                                >
                                  {t('presets.deletePreset.label')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenuPortal>
                          </DropdownMenu>
                        </div>
                      </Box>
                      <Show when={canSyncPreset()}>
                        <Box
                          display={'flex'}
                          justifyContent={'flexEnd'}
                          paddingTop={3}
                        >
                          <Button
                            theme={'secondary'}
                            block
                            size={'sm'}
                            leftIcon={<CloudIcon />}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              presetsStore.actions.syncPreset(theme);
                            }}
                          >
                            {t('presets.sync.label')}
                          </Button>
                        </Box>
                      </Show>
                    </li>
                  </div>
                </Suspense>
              );
            }}
          </For>
        </Suspense>
      </div>
    </Box>
  );
};