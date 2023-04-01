import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getPresetsStore} from '@codeimage/store/presets/presets';
import {getUiStore} from '@codeimage/store/ui';
import {
  Box,
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  HStack,
  IconButton,
  MenuButton,
  Text,
} from '@codeimage/ui';
import {formatDistanceToNow} from '@core/helpers/date';
import {Item} from '@solid-aria/collection';
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
import {TerminalHost} from '../Terminal/TerminalHost';
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

  const createDialog = createStandaloneDialog();

  const exampleCode =
    'function Preview() {\n' +
    ' const [get, set] = \n' +
    '   createSignal(0);\n' +
    '}';

  const classes = () => clsx(styles.box);

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
              variant={'solid'}
              onClick={() => {
                createDialog(RenameContentDialog, state => ({
                  title: t('dashboard.renameProject.confirmTitle'),
                  message: t('dashboard.renameProject.confirmMessage'),
                  onConfirm: async name => {
                    presetsStore.actions.addNewPreset({name});
                    state.close();
                  },
                }));
              }}
            >
              Add new
            </Button>
            <Button
              size={'xs'}
              theme={'secondary'}
              variant={'solid'}
              onClick={() => props.onClose()}
            >
              <CloseIcon size={'md'} />
            </Button>
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

              return (
                <Suspense fallback={<ThemeBoxSkeleton />}>
                  {() => {
                    return (
                      <div>
                        <li
                          class={styles.item}
                          onClick={() => onSelectTheme(data())}
                        >
                          <div>
                            <ErrorBoundary fallback={<ThemeBoxSkeleton />}>
                              <ThemeBox
                                showFooter={false}
                                background={data().frame.background ?? '#000'}
                                onClick={() => onSelectTheme(data())}
                              >
                                <TerminalHost
                                  themeClass={styles.themeBoxTerminalHost}
                                  textColor={data().terminal.textColor}
                                  background={data().terminal.background}
                                  accentVisible={data().terminal.accentVisible}
                                  shadow={data().terminal.shadow}
                                  showTab={data().terminal.alternativeTheme}
                                  readonlyTab={true}
                                  showHeader={data().terminal.showHeader}
                                  showWatermark={false}
                                  showGlassReflection={
                                    data().terminal.showGlassReflection
                                  }
                                  opacity={100}
                                  themeId={data().editor.options.themeId}
                                  alternativeTheme={
                                    data().terminal.alternativeTheme
                                  }
                                >
                                  <CustomEditorPreview
                                    themeId={data().editor.options.themeId}
                                    languageId={'typescript'}
                                    code={exampleCode}
                                  />
                                </TerminalHost>
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
                            <div>
                              <DropdownMenuV2
                                onAction={(action: string | number) => {
                                  if (action === 'update') {
                                    createDialog(PresetUpdateDialog, state => ({
                                      title: t(
                                        'dashboard.renameProject.confirmTitle',
                                      ),
                                      message: t(
                                        'dashboard.renameProject.confirmMessage',
                                      ),
                                      currentPreset: theme.data,
                                      newPreset: {
                                        frame: getFrameState().stateToPersist(),
                                        terminal:
                                          getTerminalState().stateToPersist(),
                                        editor:
                                          getRootEditorStore().stateToPersist(),
                                      },
                                      initialValue: theme.name,
                                      onConfirm: async newName => {
                                        presetsStore.actions.updatePresetName({
                                          preset: theme,
                                          newName,
                                        });
                                        state.close();
                                      },
                                    }));
                                  }
                                  if (action === 'rename') {
                                    createDialog(
                                      RenameContentDialog,
                                      state => ({
                                        title: t(
                                          'dashboard.renameProject.confirmTitle',
                                        ),
                                        message: t(
                                          'dashboard.renameProject.confirmMessage',
                                        ),
                                        initialValue: theme.name,
                                        onConfirm: async newName => {
                                          presetsStore.actions.updatePresetName(
                                            {preset: theme, newName},
                                          );
                                          state.close();
                                        },
                                      }),
                                    );
                                  }
                                  if (action === 'delete') {
                                    createDialog(ConfirmDialog, state => ({
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
                                        state.close();
                                      },
                                      actionType: 'danger' as const,
                                    }));
                                  }
                                }}
                                menuButton={
                                  <MenuButton
                                    as={IconButton}
                                    variant={'solid'}
                                    theme={'secondary'}
                                    size={'xs'}
                                  >
                                    <DotHorizontalIcon size={'md'} />
                                  </MenuButton>
                                }
                              >
                                <Item key={'update'}>
                                  {t('dashboard.updateProject.dropdownLabel')}
                                </Item>
                                <Item key={'rename'}>
                                  {t('dashboard.renameProject.dropdownLabel')}
                                </Item>
                                <Item key={'delete'}>
                                  {t('dashboard.deleteProject.dropdownLabel')}
                                </Item>
                              </DropdownMenuV2>
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
                    );
                  }}
                </Suspense>
              );
            }}
          </For>
        </Suspense>
      </div>
    </Box>
  );
};
