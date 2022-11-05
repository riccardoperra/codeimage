import {Box, Text} from '@codeimage/ui';
import {createResource} from 'solid-js';
import {
  editorImage,
  editorImageCard,
  main,
} from '~/components/Features/EditorFeature.css';
import {container} from '~/components/Features/Features.css';

export function EditorFeature() {
  return (
    <div class={main}>
      <Box class={container}>
        <Box display={'flex'}>
          <Box style={{flex: 0.8}}>
            <Box
              marginTop={24}
              marginBottom={24}
              paddingRight={24}
              paddingLeft={0}
            >
              <Text weight={'bold'} size={'5xl'}>
                Custom editor
              </Text>

              <Box marginTop={6}>
                <Text size={'xl'} style={{'line-height': 1.5}}>
                  CodeImage provide an editor with a set of defined
                  configurations that helps you to create beautiful snippets of
                  your source code in <strong>seconds</strong>.
                </Text>
              </Box>
            </Box>
          </Box>
          <Box class={editorImageCard}>
            <img
              class={editorImage}
              src={
                'https://user-images.githubusercontent.com/37072694/195017193-026527f0-a7ac-4151-90a8-bdae186f7e17.png'
              }
            />
          </Box>
        </Box>
      </Box>
    </div>
  );
}
