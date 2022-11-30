import {Button} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {createMemo, createSignal, onCleanup, onMount, untrack} from 'solid-js';
import {CodeImageLogoSvgRemote} from '~/components/CodeImageLogo/CodeImageLogo';
import * as styles from './Header.css';
import {content} from '../Main/MainPage.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  onMount(() => {
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setScrolled(!entry.isIntersecting);
      },
      {threshold: 1},
    );
    observer.observe(document.querySelector(`.${content}`));
    onCleanup(() => observer.disconnect());
  });

  const dataScrolled = createMemo(() => scrolled());

  return (
    <div class={styles.header} data-scrolled={dataScrolled() ?? false}>
      <div class={styles.headerContent}>
        <div class={styles.headerContentInner}>
          <div>
            <CodeImageLogoSvgRemote height={32} width={164} />
          </div>
          <div class={styles.headerActions}>
            <Button
              as={A}
              link={true}
              href="https://codeimage.dev"
              variant="solid"
              theme="primary"
              pill
            >
              Getting started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
