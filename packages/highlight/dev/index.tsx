import {
  backgroundColorVar,
  Box,
  CodeImageThemeProvider,
  FieldLabel,
  FlexField,
  Select,
  VStack,
} from '@codeimage/ui';
import {setElementVars} from '@vanilla-extract/dynamic';
import {createEffect, on} from 'solid-js';
import {render} from 'solid-js/web';
import Editor from './Editor/Editor';
import './global.css';
import {container} from './index.css';
import {PREVIEW_CODE} from './Editor/preview';
import './reset.scss';
import {AVAILABLE_THEMES} from './Editor/themes';
import {createThemeStore} from './themeStore';

function App() {
  const [theme, setThemeId] = createThemeStore();

  const appTheme = () => (theme().properties.darkMode ? 'dark' : 'light');

  createEffect(
    on(theme, () => {
      setElementVars(document.body, {
        [backgroundColorVar]: theme().properties.terminal.main,
      });
    }),
  );

  return (
    <CodeImageThemeProvider tokens={{}} theme={appTheme()}>
      <Box class={container}>
        <VStack spacing={'2'}>
          <FlexField size={'lg'}>
            <FieldLabel>Theme</FieldLabel>
            <Select
              value={theme().id}
              items={AVAILABLE_THEMES.map(theme => ({
                label: theme.properties.label,
                value: theme.id as string,
              }))}
              onSelectChange={themeId => setThemeId(themeId as string)}
            />
          </FlexField>

          <Editor theme={theme()} code={PREVIEW_CODE} />
        </VStack>
      </Box>
    </CodeImageThemeProvider>
  );
}

render(() => <App />, document.getElementById('root') as HTMLDivElement);
