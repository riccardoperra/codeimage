import {githubDarkTheme} from '@codeimage/highlight/githubDark';
import {
  Badge,
  Box,
  SvgIcon,
  SvgIconProps,
  Text,
  themeVars,
} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {javascript} from '@codemirror/lang-javascript';
import {EditorState, StateEffect} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {Motion, Presence} from '@motionone/solid';
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
  Show,
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
import {
  badgePicture,
  codeImageExampleImage,
  userBadge,
} from '~/components/Features/OpenSource.css';
import {scaffoldTheme} from '~/components/Features/Sidebar/PropertyEditor/SidebarPopoverHost.css';
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

function Hearth(props: SvgIconProps['svg']) {
  return (
    <SvgIcon
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </SvgIcon>
  );
}

function TwitterLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="rgb(29,161,242)"
      viewBox="0 0 256 256"
    >
      <rect width="256" height="256" fill="none"></rect>
      <path d="M245.7,77.7l-30.2,30.1C209.5,177.7,150.5,232,80,232c-14.5,0-26.5-2.3-35.6-6.8-7.3-3.7-10.3-7.6-11.1-8.8a8,8,0,0,1,3.9-11.9c.2-.1,23.8-9.1,39.1-26.4a108.6,108.6,0,0,1-24.7-24.4c-13.7-18.6-28.2-50.9-19.5-99.1a8.1,8.1,0,0,1,5.5-6.2,8,8,0,0,1,8.1,1.9c.3.4,33.6,33.2,74.3,43.8V88a48.3,48.3,0,0,1,48.6-48,48.2,48.2,0,0,1,41,24H240a8,8,0,0,1,7.4,4.9A8.4,8.4,0,0,1,245.7,77.7Z"></path>
    </svg>
  );
}

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

  const backgrounds = {
    0: 'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    1: 'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
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
        <Motion.div
          class={styles.twitterCard}
          animate={{
            backgroundColor:
              props.progress >= 66 ? darkGrayScale.gray2 : 'transparent',
          }}
        >
          <Presence>
            <Show when={props.progress > 66}>
              <Box marginBottom={4}>
                <Box class={styles.twitterTitle} marginBottom={4}>
                  <Badge
                    size={'md'}
                    theme={styles.twitterBadge}
                    variant={'rounded'}
                  >
                    <img
                      class={badgePicture}
                      src={
                        'https://avatars.githubusercontent.com/u/37072694?v=4'
                      }
                    />
                  </Badge>
                  <Box display={'flex'} flexDirection={'column'}>
                    <Text size={'lg'} weight={'bold'}>
                      CodeImage
                    </Text>
                    <Text size={'sm'}>@codeimage/app</Text>
                  </Box>
                  <Box marginLeft={'auto'}>
                    <TwitterLogo />
                  </Box>
                </Box>
                <Box>
                  <Text>
                    Do you know that SolidJS doesn't have virtual dom?
                  </Text>
                </Box>
              </Box>
            </Show>
          </Presence>

          <Motion.div>
            <CodeBox />
          </Motion.div>
        </Motion.div>
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
            EditorView.theme({
              '&': {
                fontFamily: 'Jetbrains Mono',
              },
            }),
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
