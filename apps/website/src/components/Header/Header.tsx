import {Box, Button} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {CodeImageLogo2} from '~/components/CodeImageLogo/CodeImageLogo2';
import * as styles from './Header.css';

export function Header() {
  return (
    <div class={styles.header}>
      <div class={styles.headerContent}>
        <Box display={'flex'} alignItems={'center'} flexGrow={1} marginLeft={5}>
          <CodeImageLogo2 width={'140px'} />
          <Box marginLeft={'auto'}>
            <Button
              as={A}
              link={true}
              href="https://next.codeimage.dev"
              variant={'solid'}
              theme={'primary'}
              pill
            >
              Getting started
            </Button>
          </Box>
        </Box>
      </div>
    </div>
  );
}
