import {useI18n} from '@codeimage/locale';
import {editor$} from '@codeimage/store/editor';
import {updateTheme} from '@codeimage/store/effects/onThemeChange';
import {terminal$} from '@codeimage/store/terminal';
import {CustomTheme} from '@codeimage/theme';
import {
  Box,
  FadeInOutWithScaleTransition,
  FlexField,
  Text,
  TextField,
} from '@codeimage/ui';
import {dispatch} from '@ngneat/effects';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createMemo,
  createSelector,
  createSignal,
  For,
  ParentComponent,
  Show,
} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {useModality} from '../../core/hooks/isMobile';
import {AppLocaleEntries} from '../../i18n';
import {CheckCircle} from '../Icons/CheckCircle';
import {EmptyCircle} from '../Icons/EmptyCircle';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {ThemeBox} from './ThemeBox';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';

function useFilteredThemes() {
  const {themes} = appEnvironment;
  const [search, setSearch] = createSignal('');

  const filteredThemes = createMemo(() => {
    const value = search();
    if (!value || !(value.length > 2)) return themes;
    return themes.filter(theme =>
      theme.properties.label.toLowerCase().includes(value.toLowerCase()),
    );
  });

  return [themes, filteredThemes, search, setSearch] as const;
}

export const ThemeSwitcher: ParentComponent<ThemeSwitcherVariant> = props => {
  const terminal = fromObservableObject(terminal$);
  const editor = fromObservableObject(editor$);
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();
  const [themes, filteredThemes, search, setSearch] = useFilteredThemes();

  const filteredThemeIds = () => filteredThemes().map(theme => theme.id);

  const isSelected = createSelector(() => editor.themeId);

  const onSelectTheme = (theme: CustomTheme) => {
    dispatch(updateTheme({theme}));
    umami.trackEvent(theme.id, `theme-change`);
  };

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
            placeholder={t('themeSwitcher.search')}
            value={search()}
            onChange={setSearch}
          />
        </FlexField>
      </Show>
      <For each={themes}>
        {theme => (
          <FadeInOutWithScaleTransition
            show={filteredThemeIds().includes(theme.id)}
          >
            <Box>
              <ThemeBox
                theme={theme}
                selected={isSelected(theme.id)}
                onClick={() => onSelectTheme(theme)}
              >
                <DynamicTerminal
                  tabName={'Untitled'}
                  textColor={theme.properties.terminal.text}
                  background={theme.properties.terminal.main}
                  darkMode={theme.properties.darkMode}
                  accentVisible={false}
                  shadow={terminal.shadow}
                  showTab={true}
                  readonlyTab={true}
                  showHeader={true}
                  type={terminal.type}
                  showWatermark={false}
                  showGlassReflection={terminal.showGlassReflection}
                >
                  <Text size={'sm'}>{`// Code here`}</Text>
                </DynamicTerminal>
              </ThemeBox>

              <Box display={'flex'} justifyContent={'center'} marginTop={4}>
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
            </Box>
          </FadeInOutWithScaleTransition>
        )}
      </For>
    </Box>
  );
};
