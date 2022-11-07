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
              as={A}
              href={'https://github.com/riccardoperra/codeimage'}
            >
              Github
            </Link>
            <Link
              class={styles.link}
              as={A}
              href={'https://github.com/riccardoperra/codeimage/issues'}
            >
              Issues & Feedback
            </Link>
            <Link
              class={styles.link}
              as={A}
              href={'https://github.com/riccardoperra/codeimage/releases'}
            >
              Issues & Feedback
            </Link>
          </HStack>
        </div>
      </div>
    </footer>
  );
}
