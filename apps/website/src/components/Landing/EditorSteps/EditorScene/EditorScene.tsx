import {animate, scroll} from 'motion';
import {
  children,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  lazy,
  on,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {Motion} from 'solid-motionone';
import gradientStyles from '~/theme/gradients.module.css';
import {CodeEditorPreviewBlock} from '../CodeEditor/CodeEditorPreviewBlock';
import {DynamicBackgroundExpansion} from '../EditorScene/DynamicBackgroundExpansion/DynamicBackgroundExpansion';
import {injectEditorScene} from '../scene';
import {CircularProgress} from './CircularProgress/CircularProgress';
import styles from './EditorScene.module.css';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import {ScrollDownMouse} from './ScrollDownMouse/ScrollDownMouse';
import snippetStyles from './Snippet.module.css';
import {snippetThemeValues} from './snippet-theme';
import {SnippetControls} from './SnippetControls/SnippetControls';
import {TwitterCard} from './TwitterCard/TwitterCard';

interface EditorSceneProps {
  animationProgress: number;
}

export function getScaleByRatio(
  parent: {width: number; height: number},
  child: {width: number; height: number},
  offset = 1,
): number {
  if (!parent || !child) {
    return 1;
  }

  if (child.width > parent.width && child.height > parent.height) {
    const hRatio = parent.width / child.width;
    const vRatio = parent.height / child.height;
    return Math.min(hRatio, vRatio) / offset;
  } else {
    if (child.height > parent.height) {
      return parent.height / child.height / offset;
    }

    if (child.width > parent.width) {
      return parent.width / child.width / offset;
    }
  }
  return 1;
}

const LazyEditor = lazy(() =>
  import('../CodeEditor/CodeEditor').then(m => ({default: m.CodeEditor})),
);

export function EditorScene(props: EditorSceneProps) {
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  let progressBarEl: HTMLDivElement | undefined;
  const scene = injectEditorScene();
  const [codeAnimationProgress, setCodeAnimationProgress] =
    createSignal<number>(0);

  const [containerHeight, setContainerHeight] = createSignal();
  const [scale, setScale] = createSignal<number>(1);

  const enabledCircleExpansionGradient = () =>
    scene.enableCircleExpansionGradient();

  const codeExample =
    'function Counter() {\n' +
    '  const [count, setCount] = createSignal(0);\n' +
    '\n' +
    '  // Increment the count state every second\n' +
    '  setInterval(\n' +
    '    () => setCount(count() + 1),\n' +
    '    1000\n' +
    '  );\n' +
    '\n' +
    '  return <div>The count is {count()}</div>\n' +
    '}\n';

  const visibleCode = createMemo(() =>
    codeExample.substring(
      0,
      Math.ceil(codeAnimationProgress() * codeExample.length),
    ),
  );

  const backgrounds = {
    0: gradientStyles.gradientBlueBg,
    1: gradientStyles.gradientPurpleBg,
    2: gradientStyles.gradientPurpleDarkerBg,
  };

  onMount(() => {
    const ref = scene.ref();
    if (!progressBarEl) {
      return;
    }
    scroll(
      ({y}) => {
        setCodeAnimationProgress(y.progress);
      },
      {
        target: ref,
        offset: ['-25%', '50% end'],
      },
    );
    scroll(
      animate(
        progressBarEl,
        {transform: ['scaleX(0)', 'scaleX(1)']},
        {allowWebkitAcceleration: true},
      ),
      {
        target: ref,
        offset: ['start', '95% end'],
      },
    );
  });

  const centeredWrapperTransform = () =>
    props.animationProgress >= 66 ? '-40%' : '-50%';

  function calculateScale(el: HTMLElement) {
    if (!el) {
      return 1;
    }
    return getScaleByRatio(
      {width: el.clientWidth, height: el.clientHeight},
      {width: 624, height: 612},
      1.1,
    );
  }

  const [mountEditor, setMountEditor] = createSignal(false);

  onMount(() => {
    const el = containerRef();
    if (!el) {
      return;
    }
    const linkFont = children(() => (
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap"
      />
    ));
    document.head.appendChild(linkFont() as Node);
    const observer = new ResizeObserver(entries => {
      setContainerHeight(entries[0].target.clientHeight);
    });
    observer.observe(el);
    setScale(calculateScale(el));
    createEffect(
      on(containerHeight, () => {
        setScale(calculateScale(el));
      }),
    );
    onCleanup(() => observer.unobserve(el));
  });

  createRoot(dispose => {
    createEffect(
      on(scene.inView, inView => {
        if (inView) {
          setMountEditor(true);
          dispose();
        }
      }),
    );
  });

  function getBackgroundClass() {
    return enabledCircleExpansionGradient()
      ? backgrounds[0]
      : backgrounds[scene.currentStep as keyof typeof backgrounds];
  }

  return (
    <div
      class={`${styles.container} ${getBackgroundClass()}`}
      ref={setContainerRef}
    >
      <DynamicBackgroundExpansion />

      <div class={styles.circularProgressBox}>
        <CircularProgress
          ref={el => (progressBarEl = el)}
          progress={props.animationProgress}
        />
      </div>

      <div
        class={styles.fixScaleContainer}
        style={{'--editor-container-scale': String(scale())}}
      >
        <TwitterCard visible={props.animationProgress > 66} />

        <Motion.div
          animate={{
            transform: `translate(-50%, ${centeredWrapperTransform()})`,
          }}
          class={snippetStyles.centeredWrapper}
        >
          <Motion.div
            class={`${snippetStyles.snippetTheme} ${snippetStyles.canvas}`}
            classList={{
              [backgrounds[1]]: props.animationProgress >= 66,
            }}
            animate={{
              padding: scene.currentStep >= 2 ? '32px' : 0,
            }}
          >
            <Motion.div
              data-theme-mode={'dark'}
              class={snippetStyles.canvasContent}
              style={{
                'background-color': '#261f3e',
              }}
              animate={{
                boxShadow:
                  props.animationProgress >= 40
                    ? snippetThemeValues.contentShadow
                    : undefined,
              }}
            >
              <Motion.div
                animate={{opacity: props.animationProgress >= 45 ? 1 : 0}}
              >
                <TerminalGlassReflection />
              </Motion.div>

              <Motion.div
                animate={{
                  height: props.animationProgress >= 33 ? '56px' : '0px',
                  overflow: 'hidden',
                  transition: {
                    height: {
                      easing: 'ease-out',
                    },
                    allowWebkitAcceleration: true,
                  },
                }}
              >
                <div
                  class={snippetStyles.snippetHeader}
                  data-accent-visible={true}
                >
                  <SnippetControls />
                </div>
              </Motion.div>

              <div class={snippetStyles.snippet}>
                <Suspense
                  fallback={<CodeEditorPreviewBlock code={visibleCode()} />}
                >
                  <Show
                    when={mountEditor()}
                    fallback={<CodeEditorPreviewBlock code={visibleCode()} />}
                  >
                    <LazyEditor code={visibleCode()} />
                  </Show>
                </Suspense>
              </div>
            </Motion.div>
          </Motion.div>
        </Motion.div>
      </div>
      <Motion.div
        animate={{opacity: props.animationProgress > 55 ? 0 : 1}}
        class={styles.scrollDownContainer}
      >
        <ScrollDownMouse />
        <div class={styles.scrollDownText}>Keep scrolling to continue</div>
      </Motion.div>
    </div>
  );
}
