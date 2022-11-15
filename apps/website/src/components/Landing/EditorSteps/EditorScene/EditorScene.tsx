import {synthwave84Theme} from '@codeimage/highlight/synthwave84';
import {backgroundColorVar, FadeInOutTransition} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {style} from '@vanilla-extract/css';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createSign} from 'crypto';
import {spring} from 'motion';
import {createSignal, onMount} from 'solid-js';
import {CodeEditor} from '../CodeEditor/CodeEditor';
import {injectEditorScene} from '../scene';
import * as styles from './EditorScene.css';
import {TerminalGlassReflection} from './GlassReflection/TerminalGlassReflection';
import * as styles2 from './Snippet.css';
import {scroll} from 'motion';
import {SnippetControls} from './SnippetControls/SnippetControls';
import {TwitterCard} from './TwitterCard/TwitterCard';
import {CircularProgress} from './CircularProgress/CircularProgress';

interface EditorSceneProps {
  animationProgress: number;
}

export function EditorScene(props: EditorSceneProps) {
  const scene = injectEditorScene();
  const [codeAnimationProgress, setCodeAnimationProgress] =
    createSignal<number>();

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
        offset: ['-10%', '50% end'],
      },
    );
  });

  const centeredWrapperTransform = () =>
    props.animationProgress >= 66 ? '-40%' : '-50%';

  return (
    <div
      class={styles.container}
      style={assignInlineVars({
        [backgroundColorVar]: backgrounds[scene.currentStep],
      })}
    >
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
              'background-color': synthwave84Theme.properties.terminal.main,
            }}
            animate={{
              boxShadow:
                props.animationProgress >= 40
                  ? styles2.snippetThemeVars.contentShadow
                  : undefined,
            }}
          >
            <FadeInOutTransition show={props.animationProgress >= 45}>
              <TerminalGlassReflection />
            </FadeInOutTransition>

            <Motion.div
              animate={{
                height: props.animationProgress >= 33 ? '56px' : '0',
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
              <CodeEditor code={visibleCode()} />
            </div>
          </Motion.div>
        </Motion.div>
      </Motion.div>
    </div>
  );
}
