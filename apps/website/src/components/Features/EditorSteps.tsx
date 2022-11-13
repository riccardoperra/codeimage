import {githubDarkTheme} from '@codeimage/highlight/githubDark';
import {Box, Text} from '@codeimage/ui';
import {javascript} from '@codemirror/lang-javascript';
import {EditorState, StateEffect} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {scroll} from 'motion';
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
  VoidProps,
} from 'solid-js';
import {
  editorImage,
  editorImageCardBackdrop,
  editorImageCardContainer,
  editorImageCardShadowBg,
  editorImageSticky,
  editorParallaxContent,
  editorSectionInfo,
  scrollContainer,
  sectionContainer,
  sectionCount,
  sectionWrapper,
  textParallaxBox,
} from '~/components/Features/EditorSteps.css';
import {codeImageExampleImage} from '~/components/Features/OpenSource.css';
import {EditorSidebar} from '~/components/Features/Sidebar/PropertyEditor/EditorSidebar';
import {scaffoldTheme} from '~/components/Features/Sidebar/PropertyEditor/SidebarPopoverHost.css';
import {Sidebar} from '~/components/Features/Sidebar/Sidebar';
import * as styles from './EditorSteps.css';

const sections = [
  {
    url: 'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png',
    customClass: editorImage,
  },
  {
    url: '/themes-1.png',
    customClass: editorImage,
  },
  {
    url: '/example-codeimage.png',
    customClass: codeImageExampleImage,
  },
];

export function EditorSteps() {
  let ref!: HTMLDivElement;
  const [progress, setProgress] = createSignal(0);

  let editorRef: HTMLDivElement;

  onMount(() => {
    // const sections = ref.querySelectorAll(`.${textParallaxBox}`);
    // const sectionContainer = ref.querySelector(`.${editorParallaxContent}`);
    // sections.forEach(item => {
    //   scroll(
    //     animate(item, {
    //       opacity: [0, 1, 1, 0],
    //     }),
    //     {
    //       target: item,
    //     },
    //   );
    // });
    scroll(
      ({y}) => {
        console.log(y.progress * 100);
        setProgress(y.progress);
      },
      {
        target: ref,
      },
    );
  });

  return (
    <section
      class={sectionWrapper}
      ref={ref}
      style={assignInlineVars({
        [sectionCount]: sections.length.toString(),
      })}
    >
      <SectionScrollableImage progress={progress() * 100} />
    </section>
  );
}

interface SectionScrollableImageProps {
  progress: number;
}

export function SectionScrollableImage(
  props: VoidProps<SectionScrollableImageProps>,
) {
  const mergedProps = mergeProps(
    {
      progress: 0,
    },
    props,
  );

  createEffect(() => console.log(props.progress));

  const visibleEditorImage = () => getEditorImage(mergedProps.progress ?? 0);

  function getOpacity(index: number) {
    return visibleEditorImage() === index ? 1 : 0;
  }

  const backgrounds = {
    0: 'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    1: 'linear-gradient(135deg, #FF0076 0%, #590FB7 100%)',
    2: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  };

  const offsets = [0, 33, 66];

  function getEditorImage(duration: number) {
    duration = Math.floor(duration);
    let index = 0;
    for (let i = offsets.length; i--; ) {
      if (duration >= offsets[i]) {
        index = i;
        break;
      }
    }
    return index;
  }

  return (
    <div class={editorImageSticky}>
      <div
        style={assignInlineVars({
          [editorImageCardShadowBg]: backgrounds[visibleEditorImage()],
        })}
        class={editorImageCardBackdrop}
      />
      <div class={editorSectionInfo}>
        <div class={scrollContainer}>
          <div class={sectionContainer}>
            <Box display={'flex'} class={editorParallaxContent}>
              <Motion.div
                class={textParallaxBox}
                animate={{
                  opacity:
                    props.progress >= 0 && props.progress < 33 ? 1 : 0.25,
                }}
              >
                <Box paddingLeft={0}>
                  <Text weight={'bold'} size={'2xl'}>
                    Add your code
                  </Text>

                  <Box marginTop={6}>
                    <Text size={'lg'} style={{'line-height': 1.5}}>
                      Insert your code in the editor that helps you to create
                      beautiful snippets of your source code in{' '}
                      <strong>seconds</strong>.
                    </Text>
                  </Box>
                </Box>
              </Motion.div>
              <Motion.div
                class={textParallaxBox}
                animate={{
                  opacity:
                    props.progress >= 33 && props.progress < 66 ? 1 : 0.25,
                }}
              >
                <Box paddingRight={24} paddingLeft={0}>
                  <Text weight={'bold'} size={'2xl'}>
                    Beautify it
                  </Text>

                  <Box marginTop={6}>
                    <Text size={'lg'} style={{'line-height': 1.5}}>
                      CodeImage provide a rich choice of known and custom
                      themes.
                    </Text>
                  </Box>
                </Box>
              </Motion.div>
              <Motion.div
                class={textParallaxBox}
                animate={{
                  opacity: props.progress >= 66 ? 1 : 0.25,
                }}
              >
                <Box paddingRight={24} paddingLeft={0}>
                  <Text weight={'bold'} size={'xl'}>
                    Share to everyone
                  </Text>

                  <Box marginTop={6}>
                    <Text size={'xl'} style={{'line-height': 1.5}}>
                      Once ready, you can share your snippet everywhere.
                    </Text>
                  </Box>
                </Box>
              </Motion.div>
            </Box>
          </div>
        </div>
      </div>
      <div
        class={`${editorImageCardContainer} ${scaffoldTheme}`}
        style={{
          background: backgrounds[getEditorImage(props.progress)],
        }}
      >
        <Sidebar position={'left'}></Sidebar>

        <CodeBox />
      </div>
    </div>
  );
}

function CodeBox() {
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

  const [code, setCode] = createSignal(codeExample);

  function getCode(length: number) {
    return codeExample.substring(0, length);
  }

  onMount(() => {
    scroll(
      ({y}) => {
        const trimmedCode = getCode(Math.ceil(y.progress * codeExample.length));
        setCode(trimmedCode);
      },
      {
        target: document.querySelector(`.${sectionWrapper}`),
        offset: ['0%', '50% end'],
      },
    );
  });

  return (
    <div class={styles.editorBox}>
      <CodeEditor code={code()} />
    </div>
  );
}

function CodeEditor(props: {code: string}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [editorView, setEditorView] = createSignal<EditorView>();

  createEffect(
    on(ref, ref => {
      const state = EditorState.create({doc: props?.code ?? ''});
      const currentView = new EditorView({
        state,
        parent: ref,
      });

      onMount(() => setEditorView(currentView));

      onCleanup(() => {
        setEditorView(undefined);
        editorView()?.destroy();
      });
    }),
  );

  createEffect(
    on(
      editorView,
      editorView => {
        const localValue = editorView?.state.doc.toString();

        editorView.dispatch({
          effects: StateEffect.reconfigure.of([
            javascript({jsx: true, typescript: true}),
            githubDarkTheme.editorTheme,
          ]),
        });

        if (localValue !== props?.code && !!editorView) {
          editorView.dispatch({
            changes: {
              from: 0,
              to: localValue?.length,
              insert: props?.code ?? '',
            },
          });
        }
      },
      {defer: true},
    ),
  );

  const memoizedCode = createMemo(() => props.code);

  createEffect(
    on(editorView, view => {
      if (view) {
        createEffect(
          on(memoizedCode, code => {
            const localValue = view?.state.doc.toString();
            if (localValue !== code) {
              view.dispatch({
                changes: {
                  from: 0,
                  to: localValue?.length,
                  insert: code ?? '',
                },
              });
            }
          }),
        );
      }
    }),
  );

  return <div ref={setRef}></div>;
}
