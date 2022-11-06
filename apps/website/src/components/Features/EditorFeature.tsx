import {Box, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {animate, scroll} from 'motion';
import {createSignal, For, mergeProps, onMount, VoidProps} from 'solid-js';
import {
  content,
  editorImage,
  editorImageCard,
  editorImageCardBackdrop,
  editorImageCardShadowBg,
  editorImageSticky,
  editorParallaxContent,
  editorSectionInfo,
  scrollContainer,
  sectionContainer,
  sectionWrapper,
  textParallaxBox,
} from '~/components/Features/EditorFeature.css';

export function EditorFeature() {
  let ref!: HTMLDivElement;
  const [progress, setProgress] = createSignal(0);

  onMount(() => {
    const sections = ref.querySelectorAll(`.${textParallaxBox}`);
    const sectionContainer = ref.querySelector(`.${editorParallaxContent}`);
    sections.forEach(item => {
      scroll(animate(item, {opacity: [0, 1, 1, 0]}), {
        target: item,
        offset: ['start end', 'end end', 'start start', 'end start'],
      });
    });
    scroll(({y}) => setProgress(y.progress), {
      target: sectionContainer,
      offset: ['start end', 'end end'],
    });
  });

  return (
    <section class={sectionWrapper} ref={ref}>
      <div class={content}>
        <SectionScrollableImage progress={progress()} />
        <div class={editorSectionInfo}>
          <div class={scrollContainer}>
            <div class={sectionContainer}>
              <Box display={'flex'} class={editorParallaxContent}>
                <div class={textParallaxBox}>
                  <Box marginTop={24} marginBottom={24} paddingLeft={0}>
                    <Text weight={'bold'} size={'5xl'}>
                      Custom editor
                    </Text>

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
                  <Box
                    marginTop={24}
                    marginBottom={24}
                    paddingRight={24}
                    paddingLeft={0}
                  >
                    <Text weight={'bold'} size={'5xl'}>
                      Built-in themes
                    </Text>

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        CodeImage provide a rich choice of known and custom
                        themes.
                        <p>
                          Do you think some themes are missing? Just fill an
                          issue on Github 😊
                        </p>
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Box class={textParallaxBox}>
                  <Box
                    marginTop={24}
                    marginBottom={24}
                    paddingRight={24}
                    paddingLeft={0}
                  >
                    <Text weight={'bold'} size={'5xl'}>
                      Third caption
                    </Text>

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Aliquam id lacus sem. Cras turpis velit, hendrerit at
                        tellus vel, suscipit aliquet est.
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </div>
          </div>
        </div>
        ;
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

  const offsets = [0, 66, 100];

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

  const sections = [
    {
      url: 'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png',
    },
    {
      url: '/themes-1.png',
    },
    {
      url: 'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png',
    },
  ];

  return (
    <div class={editorImageSticky}>
      <div
        style={assignInlineVars({
          [editorImageCardShadowBg]: backgrounds[visibleEditorImage()],
        })}
        class={editorImageCardBackdrop}
      />
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
                class={editorImage}
                src={section.url}
              />
            );
          }}
        </For>
      </Motion.div>
    </div>
  );
}
