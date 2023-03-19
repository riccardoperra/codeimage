import * as ApiTypes from '@codeimage/api/api-types';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {ProjectEditorPersistedState} from '@codeimage/store/editor/model';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useFilteredThemes} from '@codeimage/store/theme/useFilteredThemes';
import {Box, FlexField, TextField} from '@codeimage/ui';
import {useModality} from '@core/hooks/isMobile';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createEffect,
  createSelector,
  createSignal,
  For,
  lazy,
  ParentComponent,
  Show,
  Suspense,
} from 'solid-js';
import {getAllPresets} from '../../data-access/preset';
import {AppLocaleEntries} from '../../i18n';
import {CheckCircle} from '../Icons/CheckCircle';
import {EmptyCircle} from '../Icons/EmptyCircle';
import {TerminalHost} from '../Terminal/TerminalHost';
import {ThemeBox} from './ThemeBox';
import {ThemeBoxSkeleton} from './ThemeBoxSkeleton';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';

const CustomEditorPreview = lazy(() => {
  return import('../CustomEditor/CustomEditorPreview');
});

export const PresetSwitcher: ParentComponent<ThemeSwitcherVariant> = props => {
  // const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const modality = useModality();
  const {themeArray, themeLoading} = getThemeStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [filteredThemes, search, setSearch, isMatched] =
    useFilteredThemes(themeArray);
  const isSelected = createSelector(() => editor.state.options.themeId);

  // TODO
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSelectTheme = (data: ProjectEditorPersistedState) => {
    // TODO
    // dispatchUpdateTheme({theme, updateBackground: true});
    // getUmami().trackEvent(theme.id, `theme-change`);
  };

  const exampleCode =
    '// Just a code example \n' +
    'export function Preview() {\n' +
    ' const [count, setCount] = \n' +
    '   createSignal(0);\n' +
    '}';

  const [data, setData] = createSignal<ApiTypes.GetAllPresetApi['response']>();

  getAllPresets({}).then(setData);

  createEffect(() => console.log(data()));

  return (
    <Box
      class={styles.grid({
        orientation: props.orientation,
      })}
      style={assignInlineVars({
        [gridSize]: data()?.length?.toString() ?? '0',
      })}
    >
      <Show when={modality === 'full'} keyed={false}>
        <FlexField size={'lg'}>
          <TextField
            type={'text'}
            disabled={themeLoading()}
            placeholder={t('themeSwitcher.search')}
            value={search()}
            onChange={setSearch}
          />
        </FlexField>
      </Show>

      <For each={data()}>
        {theme => {
          return (
            <Suspense fallback={<ThemeBoxSkeleton />}>
              {(() => {
                const data = () => theme.data as ProjectEditorPersistedState;

                const themeRes = () =>
                  getThemeStore().getThemeResource(
                    data().editor.options.themeId,
                  )?.[0]?.();

                return (
                  <div>
                    <ThemeBox
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
                        alternativeTheme={data().terminal.alternativeTheme}
                      >
                        <CustomEditorPreview
                          themeId={data().editor.options.themeId}
                          languageId={'typescript'}
                          code={exampleCode}
                        />
                      </TerminalHost>
                    </ThemeBox>

                    <Box
                      display={'flex'}
                      justifyContent={'center'}
                      marginTop={4}
                    >
                      <Show
                        when={isSelected(theme.id)}
                        fallback={
                          <EmptyCircle
                            cursor={'pointer'}
                            onClick={() => onSelectTheme(data())}
                            size={'md'}
                            opacity={0.35}
                          />
                        }
                      >
                        <CheckCircle size={'md'} />
                      </Show>
                    </Box>
                  </div>
                );
              })()}
            </Suspense>
          );
        }}
      </For>
    </Box>
  );
};
