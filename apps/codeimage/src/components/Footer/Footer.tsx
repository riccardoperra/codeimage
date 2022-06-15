import {Box, Link} from '@codeimage/ui';
import {appEnvironment} from '@core/configuration';
import * as styles from './Footer.css';

export const Footer = () => {
  const {version} = appEnvironment;

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} justifyContent={'flexEnd'} padding={2}>
        <Box marginRight={5}>
          <Link href={'https://github.com/riccardoperra/codeimage'} size="xs">
            Github
          </Link>
        </Box>

        <Box marginRight={5}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage/issues'}
            size="xs"
          >
            Issue & Feedback
          </Link>
        </Box>

        <Box marginRight={5}>
          <Link
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage/releases'}
            size="xs"
          >
            Changelog
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
