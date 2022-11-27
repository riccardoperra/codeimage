import {backgroundColorVar} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {scroll, spring} from 'motion';
import {
  children,
  createEffect,
  createRoot,
  createSignal,
  on,
  onCleanup,
  onMount,
  Suspense,
} from 'solid-js';
import {CodeEditor} from '~/components/Landing/EditorSteps/CodeEditor/CodeEditor';
import {DynamicBackgroundExpansion} from '~/components/Landing/EditorSteps/EditorScene/DynamicBackgroundExpansion/DynamicBackgroundExpansion';
import {injectEditorScene} from '../scene';
import {CircularProgress} from './CircularProgress/CircularProgress';
import * as styles from './EditorScene.css';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import {ScrollDownMouse} from './ScrollDownMouse/ScrollDownMouse';
import * as styles2 from './Snippet.css';
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

export function EditorScene(props: EditorSceneProps) {
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const scene = injectEditorScene();
  const [codeAnimationProgress, setCodeAnimationProgress] =
    createSignal<number>();

  const [containerHeight, setContainerHeight] = createSignal();
  const [scale, setScale] = createSignal<number>(1);

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

  const visibleCode = () =>
    codeExample.substring(
      0,
      Math.ceil(codeAnimationProgress() * codeExample.length),
    );

  const backgrounds = {
    0: 'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    1: 'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
    2: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  };

  onMount(() => {
    const ref = scene.ref();
    scroll(
      ({y}) => {
        setCodeAnimationProgress(y.progress);
      },
      {
        target: ref,
        offset: ['-25%', '50% end'],
      },
    );
  });

  const centeredWrapperTransform = () =>
    props.animationProgress >= 66 ? '-40%' : '-50%';

  function calculateScale(el: HTMLElement) {
    if (!el) {
      return 1;
    }
    const scale = getScaleByRatio(
      {width: el.clientWidth, height: el.clientHeight},
      {width: 624, height: 612},
      1.1,
    );
    return scale;
  }

  const [mountEditor, setMountEditor] = createSignal(false);

  onMount(() => {
    const el = containerRef();
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

  return (
    <div
      class={styles.container}
      ref={setContainerRef}
      style={assignInlineVars({
        [backgroundColorVar]: backgrounds[0],
      })}
    >
      <DynamicBackgroundExpansion />

      <Motion.div
        animate={{
          top:
            props.animationProgress > 90
              ? 'calc(100% - calc(16px + 72px))'
              : '16px',
        }}
        class={styles.circularProgressBox}
      >
        <CircularProgress progress={props.animationProgress} />
      </Motion.div>

      <div
        class={styles.fixScaleContainer}
        style={assignInlineVars({
          [styles.editorContainerScale]: String(scale()),
        })}
      >
        <TwitterCard visible={props.animationProgress > 66} />

        <Motion.div
          animate={{
            transform: `translate(-50%, ${centeredWrapperTransform()})`,
          }}
          class={styles2.centeredWrapper}
        >
          <Motion.div
            class={`${styles2.snippetTheme} ${styles2.canvas}`}
            animate={{
              padding: props.animationProgress >= 66 ? '32px' : 0,
              background:
                props.animationProgress >= 66 ? backgrounds[1] : 'transparent',
              transition: {
                padding: {
                  easing: spring({velocity: 500}),
                },
              },
            }}
          >
            <Motion.div
              data-theme-mode={'dark'}
              class={styles2.canvasContent}
              style={{
                // Synthwave background color -> We posticipate the bundle fetching
                'background-color': '#261f3e',
              }}
              animate={{
                boxShadow:
                  props.animationProgress >= 40
                    ? styles2.snippetThemeVars.contentShadow
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
                      easing: spring({velocity: 150}),
                    },
                  },
                }}
              >
                <div class={styles2.snippetHeader} data-accent-visible={true}>
                  <SnippetControls />
                </div>
              </Motion.div>

              <div class={styles2.snippet}>
                <Suspense
                  fallback={
                    <pre
                      style={{
                        'font-family': 'Jetbrains Mono, monospace',
                        'background-color': 'unset',
                        color: 'white',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                      innerText={visibleCode()}
                    />
                  }
                >
                  <CodeEditor code={visibleCode()} />
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
