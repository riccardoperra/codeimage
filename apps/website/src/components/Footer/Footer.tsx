import {HStack, Link, Text} from '@codeimage/ui';
import * as styles from '~/components/Footer/Footer.css';

export default function Footer() {
  return (
    <footer class={styles.footer}>
      <div class={styles.content}>
        <div class={styles.grid}>
          <div class={styles.info}>
            <Text as={'span'} weight={'semibold'} size={'lg'}>
              © 2022 Riccardo Perra.
            </Text>
            <Text as={'span'} weight={'light'} size={'md'}>
              Made with{' '}
              <Link underline={true} href={'https://github.com/solidjs/solid'}>
                SolidJS
              </Link>{' '}
              ❤️
            </Text>
          </div>

          <HStack spacing={'8'}>
            <Link
              class={styles.link}
              underline={true}
              href={'https://github.com/riccardoperra/codeimage'}
              title="GitHub repository"
              children={'GitHub'}
            />
            <Link
              class={styles.link}
              underline={true}
              href={'https://github.com/riccardoperra/codeimage/issues'}
              title="Issues"
              children={'Issues & Feedback'}
            />
            <Link
              class={styles.link}
              underline={true}
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
