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
import {formatDistanceToNow} from '@core/helpers/date';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {As} from '@kobalte/core';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import clsx from 'clsx';
import {
  ErrorBoundary,
  For,
  lazy,
  ParentComponent,
  Show,
  Suspense,
} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {CloudIcon} from '../Icons/CloudIcon';
import {DotHorizontalIcon} from '../Icons/DotVertical';
import {PresetUpdateDialog} from '../Presets/PresetUpdateDialog';
import {PanelDivider} from '../PropertyEditor/PanelDivider';
import {DynamicTerminal} from '../Terminal/DynamicTerminal/DynamicTerminal';
import * as styles from './PresetSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {ThemeBoxSkeleton} from './ThemeBoxSkeleton';
import {ThemeSwitcherVariant} from './ThemeSwitcher.css';

const CustomEditorPreview = lazy(() => {
  return import('../CustomEditor/CustomEditorPreview');
});

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
    editor.actions.setFromPersistedState(data.editor);
    frame.setFromPersistedState(data.frame);
    terminal.setFromPersistedState(data.terminal);
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
          <Text weight={'semibold'}>User presets</Text>
          <HStack spacing={2}>
            <Button
              size={'xs'}
              theme={'primary'}
              onClick={() => {
                openDialog(RenameContentDialog, {
                  title: t('dashboard.renameProject.confirmTitle'),
                  message: t('dashboard.renameProject.confirmMessage'),
                  onConfirm: async name => {
                    presetsStore.actions.addNewPreset({name});
                  },
                });
              }}
            >
              Add new
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
          <For each={presetsStore.sortedPresets()}>
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
                      <div>
                        <ErrorBoundary fallback={<ThemeBoxSkeleton />}>
                          <ThemeBox
                            onClick={() => void 0}
                            showFooter={false}
                            background={data().frame.background ?? '#000'}
                          >
                            <DynamicTerminal
                              lite={true}
                              type={data().terminal.type}
                              readonlyTab={true}
                              showTab={true}
                              shadow={data().terminal.shadow}
                              background={data().terminal.background}
                              accentVisible={data().terminal.accentVisible}
                              textColor={data().terminal.textColor}
                              showHeader={data().terminal.showHeader}
                              showGlassReflection={
                                data().terminal.showGlassReflection
                              }
                              showWatermark={false}
                              opacity={data().terminal.opacity}
                              alternativeTheme={
                                data().terminal.alternativeTheme
                              }
                              themeId={data().editor.options.themeId}
                            >
                              <CustomEditorPreview
                                themeId={data().editor.options.themeId}
                                languageId={'typescript'}
                                code={exampleCode}
                              />
                            </DynamicTerminal>
                          </ThemeBox>
                        </ErrorBoundary>
                      </div>

                      <Box
                        display={'flex'}
                        justifyContent={'spaceBetween'}
                        marginTop={4}
                      >
                        <div>
                          <div>
                            <Text weight={'semibold'}>{theme.name}</Text>
                          </div>
                          <Box marginTop={2}>
                            <Text size={'xs'}>
                              {t('dashboard.updated')} {lastUpdateDate()}
                            </Text>
                          </Box>
                        </div>
                        {/*// TODO: find alternative to attach on dropdown*/}
                        <div
                          onclick={e => {
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
                                  Update
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    openDialog(RenameContentDialog, {
                                      title: t(
                                        'dashboard.renameProject.confirmTitle',
                                      ),
                                      message: t(
                                        'dashboard.renameProject.confirmMessage',
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
                                  {t('dashboard.renameProject.dropdownLabel')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    openDialog(ConfirmDialog, {
                                      title: t(
                                        'dashboard.deleteProject.confirmTitle',
                                      ),
                                      message: t(
                                        'dashboard.deleteProject.confirmMessage',
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
                                  {t('dashboard.deleteProject.dropdownLabel')}
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
                            Save in your account
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
