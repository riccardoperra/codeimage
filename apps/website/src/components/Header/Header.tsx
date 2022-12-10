import {Button} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, createSignal, onCleanup, onMount} from 'solid-js';
import {mainWebsiteLink} from '~/core/constants';
import {getUiStore} from '~/ui';
import {CodeImageLogoSvg} from '../CodeImageLogo/CodeImageLogoSvg';
import {content} from '../Main/MainPage.css';
import * as styles from './Header.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  const ui = getUiStore();
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
    <div
      class={styles.header}
      style={assignInlineVars({
        [styles.headerBgColor]: `${ui.value.navColor}20`,
      })}
      data-scrolled={dataScrolled() ?? false}
    >
      <div class={styles.headerContent}>
        <div class={styles.headerContentInner}>
          <CodeImageLogoSvg height={32} width={164} />
          <div class={styles.headerActions}>
            <Button
              as={'a'}
              href={mainWebsiteLink}
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
