import {Box, Button, HStack, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {animate, scroll, ScrollOffset} from 'motion';
import {createSignal, onMount} from 'solid-js';
import * as styles from '~/components/Main/MainPage.css';
import mainImage from './codeimage_preview.png';

export function MainPage() {
  let image: HTMLImageElement;

  const [progress, setProgress] = createSignal(100);

  onMount(() => {
    scroll(
      animate(image, {
        transform: [
          'rotateX(15deg) rotateY(-10deg) translateX(-100px)',
          'rotateX(0deg) rotateY(0deg) translateX(0px)',
        ],
      }),
      {
        target: image,
        offset: [...ScrollOffset.Enter, ...ScrollOffset.Exit],
      },
    );

    scroll(({y}) => setProgress(1 - y.progress), {target: image});
  });

  return (
    <div class={styles.main}>
      <div class={styles.content}>
        <Box
          display={'flex'}
          justifyContent={'center'}
          marginTop={12}
          alignItems={'center'}
          flexDirection={'column'}
          class={styles.textBox}
        >
          <Text weight={'bold'} class={styles.text}>
            A tool for <br /> <span class={styles.screenshot}>beautify</span>{' '}
            your <span class={styles.screenshot}>code</span> screenshots
          </Text>

          <HStack spacing={'4'} marginTop={12}>
            <Button
              size={'lg'}
              variant={'solid'}
              theme={'primary'}
              class={styles.giantButton}
            >
              Getting started
            </Button>

            <Button
              size={'lg'}
              variant={'solid'}
              theme={'primaryAlt'}
              class={styles.giantButton}
            >
              See more
            </Button>
          </HStack>
        </Box>
      </div>
      <div
        class={styles.imagePerspectiveBox}
        style={assignInlineVars({
          [styles.progressOpacityEditor]: `${progress()}`,
        })}
      >
        <div class={styles.imageBox} ref={image}>
          <img class={styles.imageLeft} src={mainImage} />
        </div>
      </div>
    </div>
  );
}
