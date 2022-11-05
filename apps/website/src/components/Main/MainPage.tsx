import {Box, Button, Text} from '@codeimage/ui';
import {HStack} from '@codeimage/ui';
import {
  imageLeft,
  imageBox,
  main,
  text,
  textBox,
  backdrop,
  screenshot,
} from '~/components/Main/MainPage.css';

export function MainPage() {
  return (
    <div class={main}>
      <Box
        display={'flex'}
        justifyContent={'center'}
        marginTop={12}
        flexDirection={'column'}
        alignItems={'center'}
        class={textBox}
      >
        <Text weight={'bold'} size={'6xl'} class={text}>
          Create beautiful <div class={screenshot}>screenshots</div> <br /> of
          your source code.
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
      <Box class={imageBox}>
        <img
          class={imageLeft}
          src={
            'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png'
          }
        />
        <div class={backdrop} />
      </Box>
    </div>
  );
}
