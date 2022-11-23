import {Text, HStack, Link} from '@codeimage/ui';
import {A} from '@solidjs/router';
import * as styles from '~/components/Footer/Footer.css';

export default function Footer() {
  return (
    <footer class={styles.footer}>
      <div class={styles.content}>
        <div class={styles.grid}>
          <Text as={'span'} weight={'semibold'} size={'lg'}>
            © 2022 Riccardo Perra
          </Text>

          <HStack spacing={'8'}>
            <Link
              class={styles.link}
              underline={true}
              as={A}
              href={'https://github.com/riccardoperra/codeimage'}
              title="Github repository"
              children={'Github'}
            />
            <Link
              class={styles.link}
              underline={true}
              as={A}
              href={'https://github.com/riccardoperra/codeimage/issues'}
              title="Issues"
              children={'Issues & Feedback'}
            />
            <Link
              class={styles.link}
              underline={true}
              as={A}
              href={'https://github.com/riccardoperra/codeimage/releases'}
              title="Releases"
              children={'Releases'}
            />
          </HStack>
        </div>
      </div>
    </footer>
  );
}
