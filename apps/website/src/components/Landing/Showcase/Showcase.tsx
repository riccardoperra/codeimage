import {CustomTheme} from '@codeimage/highlight';
import {backgroundColorVar, Box, Button} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {inView} from 'motion';
import {
  createMemo,
  createResource,
  createSignal,
  For,
  JSXElement,
  on,
  onMount,
  Show,
  Suspense,
  VoidProps,
} from 'solid-js';
import {CodeEditorPreviewBlock} from '~/components/Landing/EditorSteps/CodeEditor/CodeEditorPreviewBlock';
import {mainWebsiteLink} from '~/core/constants';
import {injectBreakpoints} from '~/theme/breakpoints';
import {CodeEditor} from '../EditorSteps/CodeEditor/CodeEditor';
import * as styles from './Showcase.css';

export default function Showcase() {
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
      theme: import('@codeimage/highlight/dracula').then(t => {
        return t.draculaTheme;
      }),
    },
    {
      code,
      theme: import('@codeimage/highlight/materialVolcano').then(t => {
        return t.materialVolcanoTheme;
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
      alternativeBackground:
        'linear-gradient(to right bottom, #2be7b5, #1edea2, #16d58f, #13cb7c, #16c268, #0db866, #04ae64, #00a462, #00976c, #008971, #007b72, #006d6d)',
    },
    {
      code,
      theme: import('@codeimage/highlight/nightOwl').then(t => {
        return t.nightOwlTheme;
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

  let contentEl: HTMLDivElement;
  const [isInView, setIsInView] = createSignal(true);

  onMount(() => {
    inView(
      contentEl,
      () => {
        setIsInView(true);
        return () => {
          return setIsInView(false);
        };
      },
      {amount: 0.5},
    );
  });

  return (
    <div class={styles.container}>
      <div ref={contentEl} class={styles.content} data-in-view={isInView()}>
        <Motion.div
          animate={{
            opacity: isInView() ? 1 : 0,
            transition: {
              opacity: {easing: [0.16, 1, 0.3, 1]},
            },
          }}
        >
          <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
            <h1 class={styles.heading}>Start now to beautify your snippets</h1>
            <p class={styles.description}>
              with 20+ custom themes and much more...
            </p>
          </Box>
        </Motion.div>

        <div class={styles.grid}>
          <Show
            fallback={
              <ShowcaseCodeEditorBlock
                code={blocks[0].code}
                alternativePreviewBackground={blocks[0].alternativeBackground}
              />
            }
            when={!bp.isXs()}
            keyed={false}
          >
            <For each={filteredBlocks()}>
              {block => (
                <Motion.div
                  animate={{
                    opacity: isInView() ? 1 : 0.5,
                    transform: isInView()
                      ? `translateY(0px) scale(1)`
                      : `translateY(20px) scale(0.65)`,
                    transition: {
                      easing: [0.16, 1, 0.3, 1],
                    },
                  }}
                  style={{'z-index': '10'}}
                >
                  <ShowcaseCodeEditorBlock
                    code={block.code}
                    alternativePreviewBackground={block.alternativeBackground}
                    customTheme={block.theme}
                  />
                </Motion.div>
              )}
            </For>
          </Show>
        </div>

        <div class={styles.ctaContainer}>
          <Button size={'xl'} as={'a'} href={mainWebsiteLink}>
            Getting started
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ShowcaseCodeEditorBlockProps {
  customTheme?: Promise<CustomTheme>;
  code: string;
  alternativePreviewBackground?: string;
}

function ShowcaseCodeEditorPreview(
  props: VoidProps<{code: string}>,
): JSXElement {
  return (
    <div
      class={styles.codeContainer}
      style={assignInlineVars({
        [styles.codeContainerBg]: '#1d1d1d',
      })}
    >
      <div
        class={styles.codeBlock}
        style={assignInlineVars({
          [styles.codeBlockBg]: '#111',
        })}
      >
        <CodeEditorPreviewBlock code={props.code} />
      </div>
    </div>
  );
}

export function ShowcaseCodeEditorBlock(props: ShowcaseCodeEditorBlockProps) {
  const [customTheme] = createResource(() => props.customTheme);

  return (
    <Suspense fallback={<ShowcaseCodeEditorPreview code={props.code} />}>
      <Show
        fallback={<ShowcaseCodeEditorPreview code={props.code} />}
        when={customTheme()}
        keyed={false}
      >
        <div
          class={styles.codeContainer}
          style={assignInlineVars({
            [styles.codeContainerBg]:
              props.alternativePreviewBackground ||
              customTheme().properties.previewBackground,
          })}
        >
          <div
            class={styles.codeBlock}
            style={assignInlineVars({
              [styles.codeBlockBg]: customTheme().properties.terminal.main,
            })}
          >
            <Suspense fallback={<CodeEditorPreviewBlock code={props.code} />}>
              <CodeEditor
                code={props.code}
                customTheme={Promise.resolve(customTheme().editorTheme)}
              />
            </Suspense>
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
