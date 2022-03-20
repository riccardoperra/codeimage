import * as styles from './Footer.css';
import {Box} from '../ui/Box/Box';
import {appEnvironment} from '../../core/configuration';
import {Link} from '../ui/Link/Link';

export const Footer = () => {
  const {version} = appEnvironment;

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} justifyContent={'flexEnd'} padding={'2'}>
        <Box marginRight={'5'}>
          <Link href={'https://github.com/riccardoperra/codeimage'} size="xs">
            Github
          </Link>
        </Box>

        <Box marginRight={'5'}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage/issues'}
            size="xs"
          >
            Report issue
          </Link>
        </Box>

        <Box marginRight={'5'}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage/discussions'}
            size="xs"
          >
            Feedback
          </Link>
        </Box>

        <Box>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage'}
            size="xs"
          >
            Version {version}
          </Link>
        </Box>
      </Box>
    </div>
  );
};
