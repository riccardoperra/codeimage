import {animate, scroll} from 'motion';
import type {JSX} from 'solid-js';
import {onMount} from 'solid-js';
import {Button} from '~/components/Button/Button';
import {
  FeatureCard,
  FeatureContent,
  FeatureImageContent,
} from '~/components/FeatureCard/FeatureCard';
import {mainWebsiteLink} from '~/core/constants';
import {injectBreakpoints} from '~/theme/breakpoints';
import styles from './Projects.module.css';

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
  let cardRef!: HTMLDivElement;
  const bp = injectBreakpoints();

  onMount(() => {
    if (!bp.isXs()) {
      scroll(animate(cardRef, {opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1]}), {
        target: cardRef,
        offset: ['start end', 'end end', 'start start', 'end start'],
      });
    }
  });

  return (
    <div class={styles.main}>
      <div class={styles.container}>
        <FeatureCard ref={el => (cardRef = el)}>
          <FeatureContent>
            <div class={styles.storageBadge}>
              <StorageBox width={26} height={26} />
            </div>
            <div>
              <h2 style={{margin: 0, 'font-size': '3rem', 'font-weight': 700}}>
                Store your snippets
              </h2>

              <div style={{'margin-top': '2rem'}}>
                <p
                  style={{margin: 0, 'font-size': '1.5rem', 'line-height': 1.5}}
                >
                  You want to keep track of your snippets, and have a safe place
                  to save them.
                </p>
              </div>

              <div style={{'margin-top': '2rem'}}>
                <Button
                  as={'a'}
                  size={'lg'}
                  theme={'primaryAlt'}
                  href={mainWebsiteLink}
                >
                  Getting started
                </Button>
                <div style={{'margin-top': '2rem'}}>
                  <p class={styles.descriptionText} style={{margin: 0}}>
                    *You must be authenticated to save your snippets remotely.
                  </p>
                </div>
              </div>
            </div>
          </FeatureContent>

          <FeatureImageContent bgColor={'var(--root-green)'}>
            <picture>
              <img
                class={styles.image}
                loading={'lazy'}
                alt={'Project showcase preview'}
                src={'/projects-showcase.webp'}
              />
            </picture>
          </FeatureImageContent>
        </FeatureCard>
      </div>
    </div>
  );
}
