import {Button, SvgIcon, SvgIconProps} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, createSignal, onCleanup, onMount} from 'solid-js';
import {mainWebsiteLink} from '~/core/constants';
import {injectBreakpoints} from '~/theme/breakpoints';
import {getUiStore} from '~/ui';
import {CodeImageLogoSvg} from '../CodeImageLogo/CodeImageLogoSvg';
import {content} from '../Main/MainPage.css';
import * as styles from './Header.css';

export function Header() {
  const [scrolled, setScrolled] = createSignal(false);
  const bp = injectBreakpoints();
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
              variant="solid"
              as={'a'}
              href={`${mainWebsiteLink}/login`}
              theme="secondary"
              leftIcon={<GitHubIcon />}
              class={styles.loginButton}
              title={'Login'}
            >
              Login
            </Button>

            <Button
              as={'a'}
              class={styles.gettingStartedBtn}
              href={mainWebsiteLink}
              variant="solid"
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

function GitHubIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props} fill={'currentColor'}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </SvgIcon>
  );
}
