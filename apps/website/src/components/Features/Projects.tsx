import {Box, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {animate, scroll} from 'motion';
import {onMount} from 'solid-js';
import {projectInfoContainer} from '~/components/Features/Projects.css';
import * as styles from '~/components/Features/Projects.css';

export function Projects() {
  let ref!: HTMLDivElement;
  let refShowcase!: HTMLDivElement;

  onMount(() => {
    scroll(
      animate(document.querySelector(`.${styles.projectInfoContainer}`), {
        transform: [
          `perspective(800px) rotateY(-25deg) rotateX(10deg) scale(0.4)`,
          `perspective(800px) rotateY(-15deg) rotateX(10deg) scale(2)`,
        ],
        opacity: [0.5, 1],
        right: [0, '100%'],
        top: [null, 0],
      }),
      {
        target: ref,
        offset: ['0%', 'end start'],
      },
    );

    scroll(
      animate(document.querySelector(`.${styles.projectImage}`), {
        transform: [
          `scale(1) perspective(800px) rotateY(0deg) rotateX(0deg)`,
          `scale(.5) perspective(800px) rotateY(50deg) rotateX(10deg) translateY(50%)`,
        ],
      }),
      {
        target: ref,
        offset: ['-25%', 'end start'],
      },
    );
  });

  return (
    <>
      <section class={styles.sectionWrapper} ref={ref}>
        <div class={styles.content}>
          <img class={styles.projectImage} src={'/projects-showcase.png'} />
        </div>
        <div class={styles.content}>
          <div class={styles.projectInfoContainer}>
            <div>
              <Text weight={'bold'} class={styles.title}>
                Projects
              </Text>
              <div>
                <Text weight={'bold'} class={styles.description}>
                  Save your snippets
                  <div>remotely</div>
                </Text>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
