import {Button, LoadingCircle} from '@codeimage/ui';
import {JSX, ParentProps, Show} from 'solid-js';
import * as styles from './GitHubButton.css';

type GithubButtonProps = {
  stars: number;
  class?: string;
  loading: boolean;
};

function Star(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg
      viewBox="0 0 16 16"
      class="octicon octicon-star"
      aria-hidden="true"
      fill={'currentColor'}
      overflow={'visible'}
      style={{'vertical-align': 'text-top', display: 'inlien-block'}}
      {...props}
    >
      <path
        fill-rule="evenodd"
        d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"
      />
    </svg>
  );
}

export function GitHubButton(props: ParentProps<GithubButtonProps>) {
  return (
    <Button
      size={'xl'}
      variant={'solid'}
      theme={'secondary'}
      class={
        props.class
          ? `${props.class} ${styles.githubButton}`
          : `${styles.githubButton}`
      }
    >
      <a
        class={styles.content}
        target={'_blank'}
        rel={'noopener'}
        aria-label={'Star riccardoperra/codeimage on GitHub'}
        href={'https://github.com/riccardoperra/codeimage'}
      >
        <Star width={24} height={24} />
        <span class={styles.text}>Star</span>
      </a>

      <a
        class={styles.socialCount}
        target={'_blank'}
        rel={'noopener'}
        aria-label={`${props.stars} stargazers on GitHub`}
        href={'https://github.com/riccardoperra/codeimage/stargazers'}
      >
        <Show fallback={<LoadingCircle />} when={!props.loading}>
          <span class={styles.text}>{props.stars}</span>
        </Show>
      </a>
    </Button>
  );
}
