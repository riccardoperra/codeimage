import {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {updateTheme} from '@codeimage/store/effects/onThemeChange';
import {terminal$} from '@codeimage/store/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useFilteredThemes} from '@codeimage/store/theme/useFilteredThemes';
import {Box, FlexField, TextField} from '@codeimage/ui';
import {fromObservableObject} from '@core/hooks/from-observable-object';
import {useModality} from '@core/hooks/isMobile';
import {dispatch} from '@ngneat/effects';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createSelector,
  For,
  lazy,
  ParentComponent,
  Show,
  Suspense,
  SuspenseList,
} from 'solid-js';
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

export const ThemeSwitcher: ParentComponent<ThemeSwitcherVariant> = props => {
  const terminal = fromObservableObject(terminal$);
  const {options} = getRootEditorStore();
  const modality = useModality();
  const {themeArray, themeLoading} = getThemeStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [filteredThemes, search, setSearch, isMatched] =
    useFilteredThemes(themeArray);
  const isSelected = createSelector(() => options.themeId);

  const onSelectTheme = (theme: CustomTheme) => {
    dispatch(updateTheme({theme}));
    umami.trackEvent(theme.id, `theme-change`);
  };
  const exampleCode =
    '// Just a code example \n' +
    'export function Preview() {\n' +
    ' const [count, setCount] = \n' +
    '   createSignal(0);\n' +
    '}';

  return (
    <Box
      class={styles.grid({
        orientation: props.orientation,
      })}
      style={assignInlineVars({
        [gridSize]: filteredThemes().length.toString(),
      })}
    >
      <Show when={modality === 'full'}>
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

      <SuspenseList revealOrder={'forwards'}>
        <For each={themeArray()}>
          {theme => {
            return (
              <Suspense fallback={<ThemeBoxSkeleton />}>
                <Show when={theme()}>
                  {theme => (
                    <Show when={isMatched(theme.id)}>
                      <div>
                        <ThemeBox
                          theme={theme}
                          selected={isSelected(theme.id)}
                          onClick={() => onSelectTheme(theme)}
                        >
                          <TerminalHost
                            themeClass={styles.themeBoxTerminalHost}
                            tabName={'Untitled'}
                            textColor={theme.properties.terminal.text}
                            background={theme.properties.terminal.main}
                            darkMode={theme.properties.darkMode}
                            accentVisible={false}
                            shadow={/*@once*/ terminal.shadow}
                            showTab={false}
                            readonlyTab={true}
                            showHeader={false}
                            showWatermark={false}
                            showGlassReflection={terminal.showGlassReflection}
                            opacity={100}
                            themeId={theme.id}
                            alternativeTheme={terminal.alternativeTheme}
                          >
                            <CustomEditorPreview
                              themeId={theme.id}
                              languageId={/*@once*/ 'typescript'}
                              code={/*@once*/ exampleCode}
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
                                onClick={() => dispatch(updateTheme({theme}))}
                                size={'md'}
                                opacity={0.35}
                              />
                            }
                          >
                            <CheckCircle size={'md'} />
                          </Show>
                        </Box>
                      </div>
                    </Show>
                  )}
                </Show>
              </Suspense>
            );
          }}
        </For>
      </SuspenseList>
    </Box>
  );
};
