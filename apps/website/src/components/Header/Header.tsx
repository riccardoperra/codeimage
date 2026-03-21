import type {JSX} from 'solid-js';
import {createMemo, createSignal, onCleanup, onMount} from 'solid-js';
import {Button} from '~/components/Button/Button';
import {mainWebsiteLink} from '~/core/constants';
import {getUiStore} from '~/ui';
import {CodeImageLogoSvg} from '../CodeImageLogo/CodeImageLogoSvg';
import mainStyles from '../Main/MainPage.module.css';
import styles from './Header.module.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  const ui = getUiStore();
  onMount(() => {
    const contentEl = document.querySelector(
      `.${mainStyles.content}`,
    ) as HTMLElement;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setScrolled(!entry.isIntersecting);
      },
      {rootMargin: '0px', threshold: [0.95]},
    );
    observer.observe(contentEl);
    onCleanup(() => observer.disconnect());
  });

  const dataScrolled = createMemo(() => scrolled());

  return (
    <div
      class={styles.header}
      style={{'--header-bg-color': `${ui.value.navColor}20`}}
      data-scrolled={dataScrolled() ?? false}
    >
      <div class={styles.headerContent}>
        <div class={styles.headerContentInner}>
          <CodeImageLogoSvg height={32} width={164} />
          <div class={styles.headerActions}>
            <Button
              as={'a'}
              href={`${mainWebsiteLink}/login`}
              theme="secondary"
              class={styles.loginButton}
              title={'Login'}
            >
              Login
            </Button>

            <Button
              as={'a'}
              class={styles.gettingStartedBtn}
              href={mainWebsiteLink}
              theme="primary"
              title={'Getting started'}
            >
              Getting started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
