import {Box, Text} from '@codeimage/ui';
import {
  image,
  imageBox,
  main,
  text,
  textBox,
} from '~/components/Main/MainPage.css';

export function MainPage() {
  return (
    <div class={main}>
      <Box
        display={'flex'}
        justifyContent={'center'}
        marginTop={24}
        flexDirection={'column'}
        alignItems={'center'}
        class={textBox}
      >
        <Text weight={'bold'} size={'6xl'} class={text}>
          Create beautiful screenshots of your source code.
        </Text>
      </Box>
      <Box class={imageBox}>
        <img
          class={image}
          src={
            'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png'
          }
        />
      </Box>
    </div>
  );
}
