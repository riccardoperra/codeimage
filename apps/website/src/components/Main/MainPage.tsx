import {createSignal} from 'solid-js';
import {Button} from '~/components/Button/Button';
import styles from '~/components/Main/MainPage.module.css';
import type {MainData} from '~/components/Main/MainData';
import gradientStyles from '~/theme/gradients.module.css';
import {breakpoints} from '~/theme/breakpoints';
import {betterCommentsForGitHubLink, mainWebsiteLink} from '~/core/constants';
import {GitHubButton} from '../GitHubButton/GitHubButton';
import {Header} from '../Header/Header';

interface MainPageProps {
  data?: MainData;
}

export default function MainPage(props: MainPageProps) {
  const [loading] = createSignal(false);

  const stars = () =>
    typeof props.data?.repo?.stars === 'number' ? props.data.repo.stars : 0;
  const isStarsLoading = () => typeof props.data?.repo?.stars !== 'number';

  return (
    <>
      <Header />
      <section class={styles.main}>
        <div class={styles.content}>
          <div class={styles.textBox}>
            <div class={styles.heroContainer}>
              <h1 class={styles.heading}>
                <span class={styles.screenshot}>Beautify</span> your{' '}
                <span class={styles.screenshot}>code</span> screenshots
              </h1>

              <p class={styles.mobileDescription}>
                Instantly manage your code snippets, make them beautiful to read
                and share them to everyone.
              </p>
            </div>

            <div class={styles.ctaContainer}>
              <Button
                as={'a'}
                rel={'canonical'}
                href={mainWebsiteLink}
                size={'xl'}
                theme={'primary'}
              >
                Getting started
              </Button>

              <GitHubButton
                loading={loading() || isStarsLoading()}
                stars={stars()}
              />
            </div>

            <div class={styles.ctaContainer}>
              <div class={styles.advertisingBanner}>
                <span class={styles.advertisingBadge}>NEW!</span>

                <div class={styles.advertisingDescription}>
                  Improve now your <strong>GitHub comments experience</strong>!
                  Try the new browser extension from <strong>CodeImage</strong>{' '}
                  creator!
                </div>

                <Button
                  as={'a'}
                  rel={'canonical'}
                  href={betterCommentsForGitHubLink}
                  size={'md'}
                  theme={'primaryAlt'}
                >
                  Try Better Comments For GitHub
                </Button>
              </div>
            </div>
          </div>
          <div class={styles.imagePerspectiveBox}>
            <div class={styles.imageSection}>
              <div
                class={`${styles.imageBox} ${gradientStyles.gradientBlueBg}`}
              >
                <picture>
                  <source
                    type="image/webp"
                    srcset={'/landing/codeimage_preview_mobile_ultra.webp'}
                    media={`(max-width: ${breakpoints.tablet - 1}px)`}
                  />
                  <source
                    type="image/webp"
                    srcset={'/landing/codeimage_preview_mobile.webp'}
                    media={`(min-width: ${breakpoints.tablet}px)`}
                  />
                  <source
                    type="image/webp"
                    srcset={'/landing/codeimage_preview_desktop.webp'}
                    media={`(min-width: ${breakpoints.desktop}px)`}
                  />
                  <img
                    class={styles.imageLeft}
                    loading={'lazy'}
                    src={'/landing/codeimage_preview_lite.png'}
                    alt={'Preview of CodeImage snippet'}
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
