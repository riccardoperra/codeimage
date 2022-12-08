import {Button, Link} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {createMemo, createSignal, onCleanup, onMount} from 'solid-js';
import {injectBreakpoints} from '~/core/breakpoints';
import {CodeImageLogoSvg} from '../CodeImageLogo/CodeImageLogoSvg';
import {content} from '../Main/MainPage.css';
import * as styles from './Header.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  const bp = injectBreakpoints();
  onMount(() => {
    const contentEl = document.querySelector(`.${content}`) as HTMLElement;
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
    <div class={styles.header} data-scrolled={dataScrolled() ?? false}>
      <div class={styles.headerContent}>
        <div class={styles.headerContentInner}>
          <CodeImageLogoSvg height={32} width={164} />
          <div class={styles.headerActions}>
            <Button
              as={Link}
              link={true}
              href="https://codeimage.dev"
              variant="solid"
              theme="primary"
            >
              Getting started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
