import {CustomTheme} from '@codeimage/highlight';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchUpdateTheme} from '@codeimage/store/effects/onThemeChange';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {useFilteredThemes} from '@codeimage/store/theme/useFilteredThemes';
import {Box} from '@codeimage/ui';
import {TextField} from '@codeui/kit';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {getUmami} from '@core/constants/umami';
import {useModality} from '@core/hooks/isMobile';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createSelector,
  For,
  lazy,
  ParentComponent,
  Show,
  Suspense,
} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {TerminalHost} from '../Terminal/TerminalHost';
import {ThemeBox} from './ThemeBox';
import {ThemeBoxSkeleton} from './ThemeBoxSkeleton';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';

const CustomEditorPreview = lazy(() => {
  return import('../CustomEditor/CustomEditorPreview');
});

export const ThemeSwitcher: ParentComponent<ThemeSwitcherVariant> = props => {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const modality = useModality();
  const {themeArray, themeLoading} = getThemeStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [filteredThemes, search, setSearch, isMatched] =
    useFilteredThemes(themeArray);
  const isSelected = createSelector(() => editor.state.options.themeId);

  const onSelectTheme = (theme: CustomTheme) => {
    dispatchUpdateTheme({theme, updateBackground: true});
    getUmami().track('theme-change', {
      themeId: theme.id,
    });
  };
  const exampleCode =
    '// Just a code example \n' +
    'function Preview() {\n' +
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
      <Show when={modality === 'full'} keyed={false}>
        <TextField
          disabled={themeLoading()}
          placeholder={t('themeSwitcher.search')}
          value={search()}
          onChange={setSearch}
        />
      </Show>

      <For each={themeArray()}>
        {theme => {
          return (
            <Suspense fallback={<ThemeBoxSkeleton />}>
              <Show when={theme()} keyed={true}>
                {theme => (
                  <Show when={isMatched(theme.id)} keyed={false}>
                    <div>
                      <ThemeBox
                        selected={isSelected(theme.id)}
                        background={theme.properties.previewBackground}
                        footerLabel={theme.properties.label}
                        onClick={() => onSelectTheme(theme)}
                      >
                        <TerminalHost
                          themeClass={styles.themeBoxTerminalHost}
                          textColor={theme.properties.terminal.text}
                          background={theme.properties.terminal.main}
                          borderType={terminal.state.borderType}
                          accentVisible={false}
                          shadow={/*@once*/ TERMINAL_SHADOWS.bottom}
                          showTab={false}
                          readonlyTab={true}
                          showHeader={false}
                          showWatermark={false}
                          showGlassReflection={
                            terminal.state.showGlassReflection
                          }
                          opacity={100}
                          themeId={theme.id}
                          alternativeTheme={terminal.state.alternativeTheme}
                        >
                          <CustomEditorPreview
                            themeId={theme.id}
                            languageId={'typescript'}
                            code={exampleCode}
                          />
                        </TerminalHost>
                      </ThemeBox>
                    </div>
                  </Show>
                )}
              </Show>
            </Suspense>
          );
        }}
      </For>
    </Box>
  );
};
