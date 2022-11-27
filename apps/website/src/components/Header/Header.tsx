import {Button} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {createMemo, createSignal, onMount, untrack} from 'solid-js';
import {CodeImageLogo2} from '~/components/CodeImageLogo/CodeImageLogo2';
import * as styles from './Header.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  onMount(() => {
    const isScrolled = () => window.scrollY > 150;
    setScrolled(isScrolled());
    window.addEventListener(
      'scroll',
      () => {
        const $scrolled = isScrolled();
        if (untrack(scrolled) === $scrolled) return;
        setScrolled($scrolled);
      },
      {passive: true},
    );
  });

  const dataScrolled = createMemo(() => scrolled());

  return (
    <div class={styles.header} data-scrolled={dataScrolled() ?? false}>
      <div class={styles.headerContent}>
        <div class={styles.headerContentInner}>
          <div>
            <CodeImageLogo2 width={'140px'} height={'29px'} />
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
