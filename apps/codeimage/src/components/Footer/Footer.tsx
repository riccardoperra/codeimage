import * as styles from './Footer.css';
import {Box} from '../ui/Box/Box';
import {Text} from '../ui/Text/Text';
import {useStaticConfiguration} from '../../core/configuration';

export const Footer = () => {
  const {version} = useStaticConfiguration();

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} justifyContent={'flexEnd'} padding={'2'}>
        <Box marginRight={'5'}>
          <Text as={'a'} href={'https://github.com/riccardoperra'} size="xs">
            Github
          </Text>
        </Box>

        <Box marginRight={'5'}>
          <Text
            as={'a'}
            href={'https://github.com/riccardoperra/issues'}
            size="xs"
          >
            Report issue
          </Text>
        </Box>

        <Box marginRight={'5'}>
          <Text
            as={'a'}
            href={'https://github.com/riccardoperra/discussions'}
            size="xs"
          >
            Send feedback
          </Text>
        </Box>

        <Box>
          <Text
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage'}
            size="xs"
          >
            Version {version}
          </Text>
        </Box>
      </Box>
    </div>
  );
};
