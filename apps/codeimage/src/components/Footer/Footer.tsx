import * as styles from './Footer.css';
import {Box} from '../ui/Box/Box';
import {useStaticConfiguration} from '../../core/configuration';
import {Link} from '../ui/Link/Link';

export const Footer = () => {
  const {version} = useStaticConfiguration();

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} justifyContent={'flexEnd'} padding={'2'}>
        <Box marginRight={'5'}>
          <Link href={'https://github.com/riccardoperra'} size="xs">
            Github
          </Link>
        </Box>

        <Box marginRight={'5'}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/issues'}
            size="xs"
          >
            Report issue
          </Link>
        </Box>

        <Box marginRight={'5'}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/discussions'}
            size="xs"
          >
            Send feedback
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
