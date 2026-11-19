import {
  backgroundColorVar,
  Box,
  CodeImageThemeProvider,
  FieldLabel,
  FlexField,
} from '@codeimage/ui';
import '@codeimage/ui/themes/darkTheme';
import '@codeimage/ui/themes/lightTheme';
import {setElementVars} from '@vanilla-extract/dynamic';
import {createEffect, For} from 'solid-js';
import {render} from '@solidjs/web';
import Editor from './Editor/Editor';
import {PREVIEW_CODE} from './Editor/preview';
import {AVAILABLE_THEMES} from './Editor/themes';
import './global.css';
import {container, editorContainer, themeSelect} from './index.css';
import './reset.scss';
import {createThemeStore} from './themeStore';

function App() {
  const [theme, setThemeId] = createThemeStore();
  const appTheme = () => (theme().properties.darkMode ? 'dark' : 'light');

  createEffect(theme, selected => {
    setElementVars(document.body, {
      [backgroundColorVar]: selected.properties.terminal.main,
    });
  });

  return (
    <CodeImageThemeProvider tokens={{}} theme={appTheme()}>
      <Box class={container}>
        <FlexField size={'lg'}>
          <FieldLabel for="highlight-theme">Theme</FieldLabel>
          <select
            id="highlight-theme"
            class={themeSelect}
            value={theme().id}
            onChange={event => setThemeId(event.currentTarget.value)}
          >
            <For each={AVAILABLE_THEMES}>
              {option => (
                <option value={option.id}>{option.properties.label}</option>
              )}
            </For>
          </select>
        </FlexField>
        <Box class={editorContainer}>
          <Editor theme={theme()} code={PREVIEW_CODE} />
        </Box>
      </Box>
    </CodeImageThemeProvider>
  );
}

const root = document.getElementById('root');
if (root) render(App, root);
