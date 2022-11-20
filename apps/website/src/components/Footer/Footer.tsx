import {Box, HStack, Link} from '@codeimage/ui';
import {A} from '@solidjs/router';
import * as styles from '~/components/Footer/Footer.css';

export function Footer() {
  return (
    <footer class={styles.footer}>
      <div class={styles.content}>
        <div class={styles.grid}>
          <h3>© 2022 Riccardo Perra</h3>

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
