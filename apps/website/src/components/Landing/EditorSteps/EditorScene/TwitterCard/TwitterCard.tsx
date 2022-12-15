import {Box, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {createMemo} from 'solid-js';
import {getUiStore} from '~/ui';
import * as styles from './TwitterCard.css';

interface TwitterCardProps {
  visible: boolean;
}

function TwitterLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="rgb(29,161,242)"
      viewBox="0 0 256 256"
    >
      <rect width="256" height="256" fill="none"></rect>
      <path d="M245.7,77.7l-30.2,30.1C209.5,177.7,150.5,232,80,232c-14.5,0-26.5-2.3-35.6-6.8-7.3-3.7-10.3-7.6-11.1-8.8a8,8,0,0,1,3.9-11.9c.2-.1,23.8-9.1,39.1-26.4a108.6,108.6,0,0,1-24.7-24.4c-13.7-18.6-28.2-50.9-19.5-99.1a8.1,8.1,0,0,1,5.5-6.2,8,8,0,0,1,8.1,1.9c.3.4,33.6,33.2,74.3,43.8V88a48.3,48.3,0,0,1,48.6-48,48.2,48.2,0,0,1,41,24H240a8,8,0,0,1,7.4,4.9A8.4,8.4,0,0,1,245.7,77.7Z"></path>
    </svg>
  );
}

export function TwitterCard(props: TwitterCardProps) {
  const badgePictureUrl =
    'https://avatars.githubusercontent.com/u/37072694?v=4';

  const visible = createMemo(() => props.visible);

  const transform = createMemo(() =>
    visible()
      ? `translate3d(-50%, -50%, 0) scale(1)`
      : `translate3d(-50%, -25%, 0) scale(0.1)`,
  );

  const nickname = () => getUiStore().user()?.nickname ?? 'codeimageapp';

  const username = () => {
    return `@${nickname()}`;
  };

  const picture = () => getUiStore()?.user()?.picture ?? badgePictureUrl;

  return (
    <Motion.div
      class={styles.card}
      initial={{transform: 'translate3d(-50%, 50%, 0) scale(0.1)'}}
      animate={{
        transform: transform(),
        opacity: visible() ? 1 : 0,
        transition: {
          transform: {
            easing: 'ease-in-out',
          },
          opacity: {
            easing: 'ease-in-out',
            duration: 0.3,
          },
        },
      }}
    >
      <div data-visible={props.visible} class={styles.twitterInfo}>
        <Box marginBottom={2}>
          <div class={styles.title}>
            <div class={styles.badge}>
              <img
                alt="Profile picture"
                loading="lazy"
                width={'100%'}
                height={'100%'}
                src={picture()}
              />
            </div>
            <Box display={'flex'} flexDirection={'column'}>
              <Text size={'lg'} weight={'bold'}>
                {nickname()}
              </Text>
              <Text size={'sm'}>{username()}</Text>
            </Box>
            <Box marginLeft={'auto'}>
              <TwitterLogo />
            </Box>
          </div>
          <div>
            <span>Do you know that SolidJS doesn't use Virtual Dom?</span>
          </div>
        </Box>
      </div>
    </Motion.div>
  );
}
