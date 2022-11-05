import {Box, Text} from '@codeimage/ui';
import {Show} from 'solid-js';
import {
  altBadgeContainer,
  badgeComingSoon,
  card,
  cardBox,
  container,
  description,
  main,
} from './Features.css';

export function Features() {
  return (
    <div class={main}>
      <div class={container}>
        <Box display={'flex'} justifyContent={'center'} marginBottom={24}>
          <Text weight={'bold'} size={'5xl'}>
            What's next...
          </Text>
        </Box>

        <div class={cardBox}>
          {/*<Card*/}
          {/*  title={'Manage your snippets'}*/}
          {/*  description={*/}
          {/*    'Keep in one single place all of your code snippets and share them with everyone'*/}
          {/*  }*/}
          {/*/>*/}

          <Card
            title={'Embeds'}
            description={'Embed your snippets everywhere in a SEO-friendly way'}
            comingSoon={true}
          />
          <Card
            description={
              'Create new themes for both CodeImage or your CodeMirror editor'
            }
            title={'Theme builder'}
            comingSoon={true}
          />
          <Card
            description={
              'The standalone UI kit of CodeImage for SolidJS, fully compatible with ssr.'
            }
            title={'Codeimage UIKit'}
            comingSoon={true}
          />
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  description: string;
  comingSoon?: boolean;
}

export function Card(props: CardProps) {
  return (
    <Box padding={8} borderRadius={'lg'} class={card}>
      <Show when={props.comingSoon}>
        <div class={altBadgeContainer}>
          <div class={badgeComingSoon}>Coming soon</div>
        </div>
      </Show>

      <Text weight={'semibold'} size={'2xl'}>
        {props.title}
      </Text>

      <Box marginTop={6}>
        <Text size={'lg'} class={description}>
          {props.description}
        </Text>
      </Box>
    </Box>
  );
}
