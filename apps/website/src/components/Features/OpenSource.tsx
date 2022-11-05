import {Badge, Box, Text} from '@codeimage/ui';
import {createResource, For} from 'solid-js';
import {container} from '~/components/Features/Features.css';
import {
  badgePicture,
  contributionsText,
  contributorContainer,
  contributorName,
  contributorsGrid,
  main,
  userBadge,
} from '~/components/Features/OpenSource.css';
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
  // const url =
  //   'https://api.github.com/repos/riccardoperra/codeimage/contributors';
  // return fetch(url)
  //   .then(res => res.json())
  //   .catch(() => contributors);
  const contributorsList = await Promise.resolve(contributors as Contributor[]);
  return contributorsList.filter(contributor => contributor.type !== 'Bot');
}

export function OpenSource() {
  const [data] = createResource(getContributors);

  return (
    <div class={main}>
      <Box class={container}>
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
                    <img class={badgePicture} src={contributor.avatar_url} />
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
    </div>
  );
}
