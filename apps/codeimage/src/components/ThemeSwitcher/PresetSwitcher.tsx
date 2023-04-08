import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {getUiStore} from '@codeimage/store/ui';
import {
  Box,
  Button,
  createStandaloneDialog,
  DropdownMenuV2,
  IconButton,
  MenuButton,
  Text,
} from '@codeimage/ui';
import {formatDistanceToNow} from '@core/helpers/date';
import {Item} from '@solid-aria/collection';
import {ConfirmDialog} from '@ui/ConfirmDialog/ConfirmDialog';
import {RenameContentDialog} from '@ui/ConfirmDialog/RenameContentDialog';
import clsx from 'clsx';
import {createResource, For, lazy, ParentComponent, Suspense} from 'solid-js';
import {getAllPresets} from '../../data-access/preset';
import {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {DotHorizontalIcon} from '../Icons/DotVertical';
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

  const onSelectTheme = (data: ProjectEditorPersistedState) => {
    editor.actions.setFromPersistedState(data.editor);
    frame.setFromPersistedState(data.frame);
    terminal.setFromPersistedState(data.terminal);
  };

  const createDialog = createStandaloneDialog();

  const [data] = createResource(() => getAllPresets({}));

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
          <Button
            size={'xs'}
            theme={'secondary'}
            variant={'solid'}
            onClick={() => props.onClose()}
          >
            <CloseIcon size={'md'} />
          </Button>
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
          <For each={data()}>
            {theme => {
              const data = () => theme.data as ProjectEditorPersistedState;

              const themeRes = () =>
                getThemeStore().getThemeResource(
                  data().editor.options.themeId,
                )?.[0]?.();

              const lastUpdateDate = () => {
                return formatDistanceToNow(locale(), theme.updatedAt as string);
              };

              return (
                <Suspense fallback={<ThemeBoxSkeleton />}>
                  {(() => {
                    const data = () =>
                      theme.data as ProjectEditorPersistedState;

                    return (
                      <div>
                        <li
                          class={styles.item}
                          onClick={() => onSelectTheme(data())}
                        >
                          <div>
                            <ThemeBox
                              showFooter={false}
                              theme={{
                                // TODO: to fix, we should abstract ThemeBox
                                properties: {
                                  label: theme.name,
                                  previewBackground: data().frame.background!,
                                  // @ts-expect-error TODO to fix
                                  darkMode: themeRes()?.properties.darkMode,
                                  // @ts-expect-error TODO to fix
                                  terminal: {
                                    ...themeRes()?.properties.terminal,
                                  },
                                },
                              }}
                              onClick={() => onSelectTheme(data())}
                            >
                              <TerminalHost
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
                                themeClass={styles.themeBoxTerminalHost}
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
                                        onConfirm: async name => {
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
                                <Item key={'rename'}>
                                  {t('dashboard.renameProject.dropdownLabel')}
                                </Item>
                                <Item key={'delete'}>
                                  {t('dashboard.deleteProject.dropdownLabel')}
                                </Item>
                              </DropdownMenuV2>
                            </div>
                          </Box>
                        </li>
                      </div>
                    );
                  })()}
                </Suspense>
              );
            }}
          </For>
        </Suspense>
      </div>
    </Box>
  );
};
