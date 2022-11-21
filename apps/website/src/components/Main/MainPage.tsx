import {Box, Button, HStack, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {animate, scroll, ScrollOffset} from 'motion';
import {
  createEffect,
  createResource,
  createSignal,
  JSX,
  onMount,
} from 'solid-js';
import * as styles from '~/components/Main/MainPage.css';
import {breakpoints} from '~/core/breakpoints';
import {isMobile} from '@solid-primitives/platform';
import {GithubButton} from '../GithubButton/GithubButton';

function getCssVar(str: string) {
  return /(--)[^\,\:\)]+/.exec(str)?.[0];
}

function getRepoInfo() {
  return fetch('https://ungh.unjs.io/repos/riccardoperra/codeimage')
    .then(res => res.json())
    .then(res => res.repo);
}

const repoInfoData = {
  repo: {
    id: 454158645,
    name: 'codeimage',
    repo: 'riccardoperra/codeimage',
    description:
      'Create elegant screenshots of your source code. Built with SolidJS',
    createdAt: '2022-01-31T20:25:57Z',
    updatedAt: '2022-11-13T15:09:39Z',
    pushedAt: '2022-11-21T20:24:44Z',
    stars: 185,
    watchers: 185,
    forks: 13,
  },
};

export function MainPage() {
  let section: HTMLElement;
  let image: HTMLImageElement;

  const [repoInfo] = createResource(getRepoInfo, {
    initialValue: repoInfoData,
  });

  const [progress, setProgress] = createSignal(0);

  onMount(() => {
    if (!isMobile) {
      scroll(
        animate(image, {
          transform: [
            'rotateX(15deg) rotateY(-10deg)',
            'rotateX(0deg) rotateY(0deg) translateX(0px)',
          ],
        }),
        {
          target: section,
          offset: ['0%', '70%'],
        },
      );

      scroll(({y}) => setProgress(1 - y.progress), {target: image});
    }
  });

  return (
    <section class={styles.main} ref={section}>
      <div class={styles.content}>
        <Box
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
          flexDirection={'column'}
          class={styles.textBox}
        >
          <div>
            <Text weight={'bold'} class={styles.text}>
              A tool for <br /> <span class={styles.screenshot}>beautify</span>{' '}
              your <span class={styles.screenshot}>code</span> screenshots
            </Text>

            <Text as={'p'} class={styles.mobileDescription}>
              Instantly manage your snippets, beautify and share them to
              everyone
            </Text>

            <HStack spacing={'4'} class={styles.ctaContainer}>
              <Button
                size={'lg'}
                variant={'solid'}
                theme={'primary'}
                class={styles.giantButton}
              >
                Getting started
              </Button>

              <GithubButton
                size={'lg'}
                variant={'solid'}
                theme={'secondary'}
                class={styles.giantButton}
                stars={repoInfo().stars}
              />
            </HStack>
          </div>
        </Box>
      </div>
      <div class={styles.imagePerspectiveBox}>
        <div class={styles.imageBox} ref={image}>
          <picture>
            <source
              type="image/webp"
              srcset={'/landing/codeimage_preview_mobile_ultra.webp'}
              media={`(max-width: ${breakpoints.tablet}px)`}
            />
            <source
              type="image/webp"
              srcset={'/landing/codeimage_preview_mobile.webp'}
              media={`(max-width: ${breakpoints.tablet}px)`}
            />
            <source
              type="image/webp"
              srcset={'/landing/codeimage_preview_desktop.webp'}
              media={`(min-width: ${breakpoints.tablet}px)`}
            />
            <img
              class={styles.imageLeft}
              src={'/landing/codeimage_preview_lite.png'}
              alt={'Preview of CodeImage snippet'}
            />
          </picture>
        </div>
      </div>
    </section>
  );
}

export function MainPageImagePreloading() {
  return (
    <>
      <link
        rel="preload"
        href="/landing/codeimage_preview_mobile_ultra.webp"
        as="image"
        media={`(max-width: ${breakpoints.tablet}px)`}
      />
      <link
        rel="preload"
        href={'/landing/codeimage_preview_mobile.webp'}
        as="image"
        media={`(min-width: ${breakpoints.mobile}) and (max-width: ${breakpoints.tablet}px)`}
      />
      <link
        rel="preload"
        href={'/landing/codeimage_preview_desktop.webp'}
        as="image"
        media={`(min-width: ${breakpoints.tablet}px)`}
      />
    </>
  );
}
