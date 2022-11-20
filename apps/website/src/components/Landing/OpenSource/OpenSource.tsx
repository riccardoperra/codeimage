import {Badge, Box, Text} from '@codeimage/ui';
import {animate, scroll} from 'motion';
import {createResource, For, onMount} from 'solid-js';
import {
  badgePicture,
  contributionsText,
  contributorContainer,
  contributorName,
  contributorsContent,
  contributorsGrid,
  contributorsStickyContent,
  githubLogo,
  main,
  userBadge,
} from './OpenSource.css';
import contributors from './contributors.json';

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Bot';
  contributions: number;
}

async function getContributors(): Promise<
  {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: 'User' | 'Bot';
    contributions: number;
  }[]
> {
  const contributorsList = await Promise.resolve(contributors as Contributor[]);
  return contributorsList.filter(contributor => contributor.type !== 'Bot');
}

export function OpenSource() {
  const [data] = createResource(getContributors);

  onMount(() => {
    const logo = document.querySelector(`.${githubLogo}`);
    const contributorsContentEl = document.querySelector(
      `.${contributorsContent}`,
    );
    scroll(
      animate(
        logo,
        {
          transform: [`scale(1)`, `scale(100) translateY(100px) rotate(15deg)`],
          backgroundColor: ['#000', `#111111`],
          opacity: [1, 0, 0],
        },
        {
          allowWebkitAcceleration: true,
        },
      ),
      {
        target: logo,
        offset: ['start', '25%', '50%', 'end'],
      },
    );

    scroll(
      animate(
        contributorsContentEl,
        {
          transform: [
            'scale(0.75)',
            'scale(1) translateY(-50px)',
            'scale(1) translateY(0)',
          ],
          filter: [
            'blur(30px) saturate(180%)',
            'blur(0px) saturate(100%)',
            'blur(0px) saturate(100%)',
            'blur(0px) saturate(100%)',
          ],
        },
        {
          transform: {
            allowWebkitAcceleration: true,
          },
        },
      ),
      {
        target: logo,
        offset: ['start', '25%', 'end end'],
      },
    );
  });

  return (
    <div class={main}>
      <div class={githubLogo}>
        <svg
          width={128}
          height={128}
          viewBox="0 0 1024 1024"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
            transform="scale(64)"
            fill="#fff"
          />
        </svg>
      </div>

      <Box class={contributorsContent}>
        <Box class={contributorsStickyContent}>
          <Box paddingBottom={24}>
            <Box display={'flex'} justifyContent={'center'}>
              <Text weight={'bold'} size={'5xl'}>
                Open Source
              </Text>
            </Box>

            <Box
              marginTop={6}
              display={'flex'}
              justifyContent={'center'}
              textAlign={'center'}
            >
              <Text size={'3xl'} style={{'line-height': 1.5}}>
                All the source code of the application is available on Github.{' '}
                <br />
                We thank all our contributors and supporters to make CodeImage
                better every day.
              </Text>
            </Box>
          </Box>
          <div class={contributorsGrid}>
            <For each={data()}>
              {contributor => {
                return (
                  <Box class={contributorContainer}>
                    <Badge size={'md'} theme={userBadge} variant={'rounded'}>
                      <img
                        class={badgePicture}
                        loading="lazy"
                        alt={`${contributor.login} Github profile picture`}
                        src={contributor.avatar_url}
                      />
                    </Badge>
                    <Text size={'xl'} class={contributorName}>
                      {contributor.login}
                    </Text>
                    <Box>
                      <span class={contributionsText}>
                        +{contributor.contributions} contributions
                      </span>
                    </Box>
                  </Box>
                );
              }}
            </For>
          </div>
        </Box>
      </Box>
    </div>
  );
}
