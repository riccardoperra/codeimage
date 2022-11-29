import {CustomTheme} from '@codeimage/highlight';
import {backgroundColorVar, Box, Button, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createEffect,
  createMemo,
  createResource,
  For,
  on,
  Show,
  Suspense,
} from 'solid-js';
import {injectBreakpoints} from '~/core/breakpoints';
import {CodeEditor} from '../EditorSteps/CodeEditor/CodeEditor';
import * as styles from './Showcase.css';

export function Showcase() {
  const code =
    '// Just a code example \n' +
    'export function Preview() {\n' +
    ' const [count, setCount] = \n' +
    '   createSignal(0);\n' +
    '}';

  const bp = injectBreakpoints();

  const blocks = [
    {
      code,
      theme: import('@codeimage/highlight/vsCodeDark').then(t => {
        return t.vsCodeDarkTheme;
      }),
    },
    {
      code,
      theme: import('@codeimage/highlight/dracula').then(t => {
        return t.draculaTheme;
      }),
    },
    {
      code,
      theme: import('@codeimage/highlight/githubDark').then(t => {
        return t.githubDarkTheme;
      }),
    },
    {
      code,
      theme: import('@codeimage/highlight/vitesseDark').then(t => {
        return t.vitesseDarkTheme;
      }),
    },
    {
      code,
      theme: import('@codeimage/highlight/githubLight').then(t => {
        return t.githubLightTheme;
      }),
    },
  ];

  const maxElements = createMemo(
    on([bp.isXs, bp.isTablet], ([isXs, isTablet]) => {
      if (isXs) return 1;
      if (isTablet) return 2;
      return blocks.length;
    }),
  );

  const filteredBlocks = createMemo(() => {
    return blocks.slice(0, maxElements());
  });

  return (
    <div class={styles.container}>
      <div class={styles.content}>
        <Box
          display={'flex'}
          justifyContent={'center'}
          flexDirection={'column'}
          alignItems={'center'}
        >
          <h1 class={styles.heading}>Start now to beautify your snippets</h1>
          <p class={styles.description}>
            with 20+ custom themes and much more...
          </p>
        </Box>

        <div class={styles.grid}>
          <For each={filteredBlocks()}>
            {block => (
              <PreviewCodeEditor code={block.code} customTheme={block.theme} />
            )}
          </For>
        </div>
        <Box
          marginTop={24}
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Button size={'lg'}>Getting started</Button>
        </Box>
      </div>
    </div>
  );
}

interface PreviewCodeEditorProps {
  customTheme: Promise<CustomTheme>;
  code: string;
}
export function PreviewCodeEditor(props: PreviewCodeEditorProps) {
  const [customTheme] = createResource(() => props.customTheme, {
    deferStream: true,
  });

  return (
    <Suspense fallback={<></>}>
      <Show when={customTheme()}>
        <div
          class={styles.codeContainer}
          style={assignInlineVars({
            [styles.codeContainerBg]:
              customTheme()?.properties.previewBackground,
          })}
        >
          <div
            class={styles.codeBlock}
            style={assignInlineVars({
              [styles.codeBlockBg]: customTheme()?.properties.terminal.main,
            })}
          >
            <CodeEditor
              code={props.code}
              customTheme={Promise.resolve(customTheme()?.editorTheme)}
            />
          </div>
          <div
            class={styles.backdrop}
            style={assignInlineVars({
              [backgroundColorVar]: customTheme().properties.previewBackground,
            })}
          />
        </div>
      </Show>
    </Suspense>
  );
}
