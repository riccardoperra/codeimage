import * as styles from './Header.css';
import {Box, TextField, Button} from '@codeimage/ui';
import {CodeImageLogo} from '../CodeImageLogo/CodeImageLogo';

export function Header() {
  return (
    <div class={styles.header}>
      <div class={styles.headerContent}>
        <Box display={'flex'} alignItems={'center'} flexGrow={1} marginLeft={5}>
          <CodeImageLogo width={'140px'} />
          <Box marginLeft={'auto'}>
            <Button variant={'solid'} theme={'primary'}>
              Start coding
            </Button>
          </Box>
        </Box>
      </div>
    </div>
  );
}
