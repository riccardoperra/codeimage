import type {CustomTheme} from '@codeimage/highlight';
import {Motion} from 'solid-motionone';
import {inView} from 'motion';
import type {JSXElement, VoidProps} from 'solid-js';
import {createMemo, createSignal, For, on, onMount, Show} from 'solid-js';
import {Button} from '~/components/Button/Button';
import {CodeEditorPreviewBlock} from '~/components/Landing/EditorSteps/CodeEditor/CodeEditorPreviewBlock';
import {mainWebsiteLink} from '~/core/constants';
import {injectBreakpoints} from '~/theme/breakpoints';
import {CodeEditor} from '../EditorSteps/CodeEditor/CodeEditor';
import styles from './Showcase.module.css';

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
      loadTheme: () =>
        import('@codeimage/highlight/dracula').then(t => t.draculaTheme),
    },
    {
      code,
      loadTheme: () =>
        import('@codeimage/highlight/materialVolcano').then(
          t => t.materialVolcanoTheme,
        ),
    },
    {
      code,
      loadTheme: () =>
        import('@codeimage/highlight/githubDark').then(t => t.githubDarkTheme),
    },
    {
      code,
      loadTheme: () =>
        import('@codeimage/highlight/vitesseDark').then(
          t => t.vitesseDarkTheme,
        ),
      alternativeBackground:
        'linear-gradient(to right bottom, #2be7b5, #1edea2, #16d58f, #13cb7c, #16c268, #0db866, #04ae64, #00a462, #00976c, #008971, #007b72, #006d6d)',
    },
    {
      code,
      loadTheme: () =>
        import('@codeimage/highlight/nightOwl').then(t => t.nightOwlTheme),
    },
  ];

  const maxElements = createMemo(
    on([bp.isXs, bp.isTablet], ([isXs, isTablet]) => {
      if (isXs) return 1;
      if (isTablet) return 2;
      return blocks.length;
    }),
  );

  const filteredBlocks = createMemo(() => blocks.slice(0, maxElements()));

  let contentEl!: HTMLDivElement;
  const [isInView, setIsInView] = createSignal(true);

  onMount(() => {
    inView(
      contentEl,
      () => {
        setIsInView(true);
        return () => setIsInView(false);
      },
      {amount: 0.5},
    );
  });

  return (
    <div class={styles.container}>
      <div
        ref={el => (contentEl = el)}
        class={styles.content}
        data-in-view={isInView()}
      >
        <Motion.div
          animate={{
            opacity: isInView() ? 1 : 0,
            transition: {
              opacity: {easing: [0.16, 1, 0.3, 1]},
            },
          }}
        >
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
            }}
          >
            <h1 class={styles.heading}>Start now to beautify your snippets</h1>
            <p class={styles.description}>
              with 20+ custom themes and much more...
            </p>
          </div>
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
                      ? 'translateY(0px) scale(1)'
                      : 'translateY(20px) scale(0.65)',
                    transition: {
                      easing: [0.16, 1, 0.3, 1],
                    },
                  }}
                  style={{'z-index': '10'}}
                >
                  <ShowcaseCodeEditorBlock
                    code={block.code}
                    alternativePreviewBackground={block.alternativeBackground}
                    loadTheme={block.loadTheme}
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
  loadTheme?: () => Promise<CustomTheme>;
  code: string;
  alternativePreviewBackground?: string;
}

function ShowcaseCodeEditorPreview(
  props: VoidProps<{code: string}>,
): JSXElement {
  return (
    <div
      class={styles.codeContainer}
      style={{'--code-container-bg': '#1d1d1d'}}
    >
      <div class={styles.codeBlock} style={{'--code-block-bg': '#111'}}>
        <CodeEditorPreviewBlock code={props.code} />
      </div>
    </div>
  );
}

export function ShowcaseCodeEditorBlock(props: ShowcaseCodeEditorBlockProps) {
  const [customTheme, setCustomTheme] = createSignal<CustomTheme>();

  onMount(() => {
    if (!props.loadTheme) {
      return;
    }

    void props
      .loadTheme()
      .then(setCustomTheme)
      .catch(() => null);
  });

  return (
    <Show
      fallback={<ShowcaseCodeEditorPreview code={props.code} />}
      when={customTheme()}
      keyed
    >
      {theme => (
        <div
          class={styles.codeContainer}
          style={{
            '--code-container-bg':
              props.alternativePreviewBackground ||
              theme.properties.previewBackground,
          }}
        >
          <div
            class={styles.codeBlock}
            style={{
              '--code-block-bg': theme.properties.terminal.main,
            }}
          >
            <CodeEditor
              code={props.code}
              customTheme={Promise.resolve(theme.editorTheme)}
            />
          </div>
          <div
            class={styles.backdrop}
            style={{
              '--background-color': theme.properties.previewBackground,
            }}
          />
        </div>
      )}
    </Show>
  );
}
