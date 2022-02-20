import * as styles from './Footer.css';
import {Box} from '../ui/Box/Box';
import {useStaticConfiguration} from '../../core/configuration/ConfigurationProvider';
import {Text} from '../ui/Text/Text';

export const Footer = () => {
  const {version} = useStaticConfiguration();

  return (
    <div class={styles.wrapper}>
      <Box display={'flex'} justifyContent={'flexEnd'} padding={'2'}>
        <Text
          as={'a'}
          href={'https://github.com/riccardoperra/codeimage'}
          size="xs"
        >
          Version {version}
        </Text>
      </Box>
    </div>
  );
};
