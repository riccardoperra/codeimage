import {Box, Button, Text} from '@codeimage/ui';
import {HStack} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {animate, inView} from 'motion';
import {onMount} from 'solid-js';
import * as styles from '~/components/Main/MainPage.css';

export function MainPage() {
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
      <div class={styles.imageBox}>
        <img class={styles.imageLeft} src={'/codeimage_10.png'} />
        {/*<div class={styles.backdrop} />*/}
      </div>
    </div>
  );
}
