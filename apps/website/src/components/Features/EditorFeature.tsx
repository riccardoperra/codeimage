import {Box, Button, HStack, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {animate, scroll} from 'motion';
import {createSignal, For, mergeProps, onMount, VoidProps} from 'solid-js';
import {
  content,
  editorImage,
  editorImageCard,
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
} from '~/components/Features/EditorFeature.css';
import {codeImageExampleImage} from '~/components/Features/OpenSource.css';
import * as styles from './EditorFeature.css';

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

export function EditorFeature() {
  let ref!: HTMLDivElement;
  // const {ref: editorRef} = createCodeMirror({
  //   value:
  //     '  onMount(() => {\n' +
  //     '    const sections = ref.querySelectorAll(`.${textParallaxBox}`);\n' +
  //     '    const sectionContainer = ref.querySelector(`.${editorParallaxContent}`);\n' +
  //     '    sections.forEach(item => {\n' +
  //     '      scroll(\n' +
  //     '        animate(item, {\n' +
  //     '          opacity: [0, 1, 1, 0],\n' +
  //     '        }),\n' +
  //     '        {\n' +
  //     '          target: item,\n' +
  //     '        },\n' +
  //     '      );\n' +
  //     '    });\n' +
  //     '    scroll(({y}) => setProgress(y.progress), {\n' +
  //     '      target: sectionContainer,\n' +
  //     "      offset: ['start', 'start end', 'end end', '100%'],\n" +
  //     '    });\n' +
  //     '  });',
  // });

  const [progress, setProgress] = createSignal(0);

  let editorRef: HTMLDivElement;

  onMount(() => {
    const sections = ref.querySelectorAll(`.${textParallaxBox}`);
    const sectionContainer = ref.querySelector(`.${editorParallaxContent}`);
    sections.forEach(item => {
      scroll(
        animate(item, {
          opacity: [0, 1, 1, 0],
        }),
        {
          target: item,
        },
      );
    });
    scroll(({y}) => setProgress(y.progress), {
      target: sectionContainer,
      offset: ['start', 'start end', 'end end', '100%'],
    });
  });

  return (
    <section
      class={sectionWrapper}
      ref={ref}
      style={assignInlineVars({
        [sectionCount]: sections.length.toString(),
      })}
    >
      <div class={content}>
        <SectionScrollableImage progress={progress()} />
        <div class={editorSectionInfo}>
          <div class={scrollContainer}>
            <div class={sectionContainer}>
              <Box display={'flex'} class={editorParallaxContent}>
                <div class={textParallaxBox}>
                  <Box paddingLeft={0}>
                    <Text weight={'bold'} size={'4xl'}>
                      Custom editor
                    </Text>

                    <div ref={editorRef} />

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        CodeImage provide an editor with a set of defined
                        configurations that helps you to create beautiful
                        snippets of your source code in <strong>seconds</strong>
                        .
                      </Text>
                    </Box>
                  </Box>
                </div>
                <Box class={textParallaxBox}>
                  <Box paddingRight={24} paddingLeft={0}>
                    <Text weight={'bold'} size={'4xl'}>
                      Style your code
                    </Text>

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        CodeImage provide a rich choice of known and custom
                        themes.
                        <p>
                          You can highlight your code using many languages,
                          split them into multiple files and so much more!
                        </p>
                        <p>
                          Do you think some themes are missing? Just fill an
                          issue on Github 😊
                        </p>
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box class={textParallaxBox}>
                  <Box paddingRight={24} paddingLeft={0}>
                    <Text weight={'bold'} size={'4xl'}>
                      Share to everyone
                    </Text>

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        Once ready, you can share your snippet everywhere.
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </div>
          </div>
        </div>
      </div>
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

  const visibleEditorImage = () => getEditorImage(mergedProps.progress ?? 0);

  function getOpacity(index: number) {
    return visibleEditorImage() === index ? 1 : 0;
  }

  const backgrounds = {
    0: 'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    1: 'linear-gradient(135deg, #FF0076 0%, #590FB7 100%)',
    2: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  };

  const offsets = [0, 65, 80];

  function getEditorImage(duration: number) {
    duration = Math.floor(duration * 100);
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
      <div class={editorImageCardContainer}>
        <Motion.div
          animate={{
            background: backgrounds[visibleEditorImage()],
          }}
          class={editorImageCard}
        >
          <For each={sections}>
            {(section, index) => {
              return (
                <Motion.img
                  initial={{opacity: index() === 0 ? 1 : 0}}
                  animate={{opacity: getOpacity(index())}}
                  exit={{opacity: 0, transition: {duration: 0.8}}}
                  class={section.customClass}
                  src={section.url}
                />
              );
            }}
          </For>
        </Motion.div>
      </div>
    </div>
  );
}
