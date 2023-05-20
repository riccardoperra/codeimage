import {
  backgroundColorVar,
  Box,
  CodeImageThemeProvider,
  FieldLabel,
  FlexField,
} from '@codeimage/ui';
import '@codeimage/ui/themes/darkTheme';
import '@codeimage/ui/themes/lightTheme';
import {createSelectOptions, Select} from '@codeui/kit';
import {setElementVars} from '@vanilla-extract/dynamic';
import {createEffect, on} from 'solid-js';
import {render} from 'solid-js/web';
import Editor from './Editor/Editor';
import {PREVIEW_CODE} from './Editor/preview';
import {AVAILABLE_THEMES} from './Editor/themes';
import './global.css';
import {container, editorContainer} from './index.css';
import './reset.scss';
import {createThemeStore} from './themeStore';

function App() {
  const [theme, setThemeId] = createThemeStore();
  const appTheme = () => (theme().properties.darkMode ? 'dark' : 'light');

  createEffect(
    on(theme, () => {
      document.documentElement.setAttribute('data-cui-theme', appTheme());
      setElementVars(document.body, {
        [backgroundColorVar]: theme().properties.terminal.main,
      });
    }),
  );

  const options = createSelectOptions(
    AVAILABLE_THEMES.map(theme => ({
      label: theme.properties.label,
      value: theme.id as string,
    })),
    {key: 'label', valueKey: 'value'},
  );

  return (
    <CodeImageThemeProvider tokens={{}} theme={appTheme()}>
      <Box class={container}>
        <FlexField size={'lg'}>
          <FieldLabel>Theme</FieldLabel>
          <Select
            {...options.props()}
            {...options.controlled(
              () => theme().id,
              value => setThemeId(value as string),
            )}
            aria-label={'Options'}
            options={options.options()}
          />
        </FlexField>
        <Box class={editorContainer}>
          <Editor theme={theme()} code={PREVIEW_CODE} />
        </Box>
      </Box>
    </CodeImageThemeProvider>
  );
}

render(() => <App />, document.getElementById('root') as HTMLDivElement);
