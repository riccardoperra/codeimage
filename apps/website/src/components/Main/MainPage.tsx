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
          <Text weight={'bold'} size={'6xl'} class={styles.text}>
            Beautiful <div class={styles.screenshot}>screenshots</div>
            <br />
            of your source code.
          </Text>

          <HStack spacing={4} marginTop={6}>
            <Button size={'lg'} variant={'solid'} theme={'primary'}>
              Getting started
            </Button>

            <Button size={'lg'} variant={'solid'} theme={'primaryAlt'}>
              See more
            </Button>
          </HStack>
        </Box>
      </div>
      <div class={styles.imageBox}>
        <img
          class={styles.imageLeft}
          src={
            'https://user-images.githubusercontent.com/37072694/175815293-b3a55a21-972f-410f-937d-8d3a1229869e.png'
          }
        />
        <div class={styles.backdrop} />
      </div>
    </div>
  );
}
