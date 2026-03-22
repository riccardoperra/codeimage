import styles from '~/components/Footer/Footer.module.css';

export default function Footer() {
  return (
    <footer class={styles.footer}>
      <div class={styles.content}>
        <div class={styles.grid}>
          <div class={styles.info}>
            <span class={styles.copyright}>© 2022 Riccardo Perra.</span>
            <span class={styles.description}>
              Made with{' '}
              <a class={styles.link} href={'https://github.com/solidjs/solid'}>
                SolidJS
              </a>{' '}
              ❤️
            </span>
          </div>

          <div class={styles.linkRow}>
            <a
              class={`${styles.link} ${styles.onlyDesktopLink}`}
              href={
                'https://github.com/riccardoperra/better-comments-for-github'
              }
              target={'_blank'}
              rel={'noopener'}
              title="Better Comments for GitHub"
            >
              GitHub
            </a>
            <a
              class={styles.link}
              href={'https://github.com/riccardoperra/codeimage'}
              title="GitHub repository"
            >
              GitHub
            </a>
            <a
              class={styles.link}
              href={'https://github.com/riccardoperra/codeimage/issues'}
              title="Issues"
            >
              Issues & Feedback
            </a>
            <a
              class={styles.link}
              href={'https://github.com/riccardoperra/codeimage/releases'}
              title="Releases"
            >
              Releases
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
