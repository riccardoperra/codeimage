import * as themes from '@codeimage/highlight/themes';
import {backgroundColorVar, Box, Text} from '@codeimage/ui';
import {EditorView} from '@codemirror/view';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {For} from 'solid-js';
import {Footer} from '../../components/Footer/Footer';
import {DashboardHeader} from '../Dashboard/components/DashboardHeader/DashboardHeader';
import * as styles from '../Dashboard/Dashboard.css';
import CustomEditorPreview from './CustomEditorPreview';
import * as styles2 from './themes.css';

export default function ThemeBuilderPage() {
  const exampleCode =
    'function Counter() {\n' +
    '  const [count, setCount] = createSignal(0);\n' +
    '  \n' +
    '  setInterval(\n' +
    '    () => setCount(count() + 1),\n' +
    '    1000\n' +
    '  );\n' +
    '\n' +
    '  return <div>The count is {count()}</div>\n' +
    '}';

  return (
    <div class={styles.scaffold}>
      <Box display={'flex'} height={'100%'}>
        <div class={styles.wrapper}>
          <DashboardHeader />

          <div class={styles.main}>
            <Box display={'flex'} flexDirection={'row'} height={'100%'}>
              {/*<Sidebar position={'left'}>*/}
              {/*  <AdvancedSyntaxHighlightEditor />*/}
              {/*</Sidebar>*/}
              <div class={styles.wrapper} style={{overflow: 'auto'}}>
                <div class={styles2.themeCardList}>
                  <For each={Object.values(themes)}>
                    {theme => (
                      <div class={styles2.themeCard}>
                        <Text size={'lg'} weight={'semibold'}>
                          {theme.properties.label}
                        </Text>
                        <div
                          class={styles2.themeBox}
                          style={assignInlineVars({
                            [backgroundColorVar]:
                              theme.properties.terminal.main,
                          })}
                        >
                          <CustomEditorPreview
                            theme={{
                              ...theme,
                              editorTheme: [
                                theme.editorTheme,
                                EditorView.theme({
                                  '.cm-content': {'font-size': '12px'},
                                }),
                              ],
                            }}
                            languageId={'typescript'}
                            code={exampleCode}
                          />
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Box>
          </div>

          <Footer />
        </div>
      </Box>
    </div>
  );
}
