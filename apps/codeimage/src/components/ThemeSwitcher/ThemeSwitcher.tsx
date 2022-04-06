import {
  Component,
  createMemo,
  createSelector,
  createSignal,
  For,
  Show,
} from 'solid-js';
import {FlexField, Text, TextField} from '@codeimage/ui';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {terminal$} from '@codeimage/store/terminal';
import {editor$} from '@codeimage/store/editor';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {appEnvironment} from '../../core/configuration';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Box} from '../../ui/Box/Box';
import {FadeInOutWithScaleTransition} from '../../ui/Transition/Transition';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {useModality} from '../../core/hooks/isMobile';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {dispatch} from '@ngneat/effects';
import {updateTheme} from '../../state/effect';
import {EmptyCircle} from '../Icons/EmptyCircle';
import {CheckCircle} from '../Icons/CheckCircle';

function useFilteredThemes() {
  const {themes} = appEnvironment;
  const [search, setSearch] = createSignal('');

  const filteredThemes = createMemo(() => {
    const value = search();
    if (!value || !(value.length > 2)) return themes;
    return themes.filter(theme =>
      theme.properties.label.toLowerCase().startsWith(value.toLowerCase()),
    );
  });

  return [themes, filteredThemes, search, setSearch] as const;
}

export const ThemeSwitcher: Component<ThemeSwitcherVariant> = props => {
  const terminal = fromObservableObject(terminal$);
  const editor = fromObservableObject(editor$);
  const modality = useModality();
  const [t] = useI18n<AppLocaleEntries>();
  const [themes, filteredThemes, search, setSearch] = useFilteredThemes();

  const filteredThemeIds = () => filteredThemes().map(theme => theme.id);

  const isSelected = createSelector(() => editor.themeId);

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
                onClick={() => dispatch(updateTheme({theme}))}
              >
                <DynamicTerminal
                  tabName={'Untitled'}
                  textColor={theme.properties.terminal.text}
                  background={theme.properties.terminal.main}
                  darkMode={theme.properties.darkMode}
                  accentVisible={terminal.accentVisible}
                  shadow={terminal.shadow}
                  showTab={true}
                  readonlyTab={true}
                  showHeader={true}
                  type={terminal.type}
                  showWatermark={false}
                >
                  <Text size={'sm'}>{`// Code here`}</Text>
                </DynamicTerminal>
              </ThemeBox>

              <Box display={'flex'} justifyContent={'center'} marginTop={'4'}>
                <Show
                  when={isSelected(theme.id)}
                  fallback={<EmptyCircle size={'md'} opacity={0.35} />}
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
