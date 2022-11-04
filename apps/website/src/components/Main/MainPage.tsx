import {Box, Text} from '@codeimage/ui';
import {
  imageLeft,
  imageRight,
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
      <div class={backdrop}/>
      <Box
        display={'flex'}
        justifyContent={'center'}
        marginTop={12}
        flexDirection={'column'}
        alignItems={'center'}
        class={textBox}
      >
        <Text weight={'bold'} size={'6xl'} class={text}>
          Create beautiful <div class={screenshot}>screenshots</div> <br/> of your source code.
        </Text>
      </Box>
      <Box class={imageBox}>
        <img
          class={imageLeft}
          src={
            'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png'
          }
        />

      </Box>
    </div>
  );
}
