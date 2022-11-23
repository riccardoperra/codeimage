import {Badge, Box, Button, SvgIcon, SvgIconProps, Text} from '@codeimage/ui';
import {A} from '@solidjs/router';
import {animate, scroll} from 'motion';
import {JSX, onMount} from 'solid-js';
import * as styles from './Projects.css';

function StorageBox(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
      <path
        fill-rule="evenodd"
        d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
        clip-rule="evenodd"
      />
    </svg>
  );
}

export default function Projects() {
  let cardRef: HTMLDivElement;

  onMount(() => {
    scroll(animate(cardRef, {opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1]}), {
      target: cardRef,
      offset: ['start end', 'end end', 'start start', 'end start'],
    });
  });

  return (
    <div class={styles.main}>
      <div class={styles.container}>
        <div class={styles.card} ref={cardRef}>
          <div class={styles.content}>
            <Badge theme={styles.storageBadge}>
              <StorageBox width={26} height={26} />
            </Badge>

            <Box>
              <Text size={'5xl'} weight={'bold'}>
                Store your snippets
              </Text>

              <Box marginTop={8}>
                <Text size={'2xl'}>
                  <span>
                    You want to keep track of your snippets, and have a safe
                    place to save them.
                  </span>
                </Text>
              </Box>
            </Box>

            <Button
              as={A}
              href={'https://codeimage.dev/dashboard'}
              size={'lg'}
              theme={'primaryAlt'}
              variant={'solid'}
            >
              Getting started
            </Button>
          </div>
          <div class={styles.imageSection}>
            <div class={styles.imageWrapper}>
              <picture>
                {/* <source type="image/webp" srcset={'/projects-showcase.webp'} loading={'lazy'} /> */}
                <img
                  class={styles.image}
                  loading={'lazy'}
                  alt={'Project showcase preview'}
                  src={'/projects-showcase.webp'}
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
