import {Box, Text} from '@codeimage/ui';
import {animate, scroll} from 'motion';
import {onMount} from 'solid-js';
import {
  editorSectionInfo,
  editorImage,
  editorImageCard,
  editorImageSticky,
  editorParallaxContent,
  sectionWrapper,
  content,
  scrollContainer,
  sectionContainer,
  textParallaxBox,
} from '~/components/Features/EditorFeature.css';

export function EditorFeature() {
  let ref!: HTMLDivElement;

  onMount(() => {
    const sections = ref.querySelectorAll(`.${textParallaxBox}`);
    sections.forEach(item => {
      scroll(animate(item, {opacity: [0, 1, 1, 0]}), {
        target: item,
        offset: ['start end', 'end end', 'start start', 'end start'],
      });
    });
  });

  return (
    <section class={sectionWrapper} ref={ref}>
      <div class={content}>
        <div class={editorImageSticky}>
          <div class={editorImageCard}>
            <img
              class={editorImage}
              src={
                'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png'
              }
            />
          </div>
        </div>
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
                      Third themes
                    </Text>

                    <Box marginTop={6}>
                      <Text size={'xl'} style={{'line-height': 1.5}}>
                        CodeImage provide an editor with a set of defined
                        configurations that helps you to create beautiful.
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
