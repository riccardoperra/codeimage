import {Box, Button} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {createMemo, createSignal, onMount} from 'solid-js';
import {untrack} from 'solid-js';
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
    <div class={styles.header} data-scrolled={dataScrolled()}>
      <div class={styles.headerContent}>
        <Box
          display={'flex'}
          alignItems={'center'}
          flexGrow={1}
          marginLeft={5}
          marginRight={5}
        >
          <CodeImageLogo2 width={'140px'} height={'29pxs'} />
          <Box marginLeft={'auto'}>
            <Button
              as={A}
              link={true}
              href="https://next.codeimage.dev"
              variant={'solid'}
              theme={'primary'}
              pill
              style={{
                'background-color': '#005994',
              }}
            >
              Getting started
            </Button>
          </Box>
        </Box>
      </div>
    </div>
  );
}
