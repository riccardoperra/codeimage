import {Link} from '@codeui/kit';
import {FlowProps} from 'solid-js';
import {fullChangelogLink} from './ChangelogItem.css';
import * as styles from './ChangelogItem.css';

interface ChangelogItemProps {
  version: string;
  latest: boolean;
  date: Date;
}

export function ChangelogItem(props: FlowProps<ChangelogItemProps>) {
  const formattedDate = () =>
    new Intl.DateTimeFormat('en-US', {dateStyle: 'medium'}).format(props.date);

  const tag = () => `v${props.version}`;

  const githubLink = () =>
    `https://github.com/riccardoperra/codeimage/releases/tag/${tag()}`;

  return (
    <div class={styles.item}>
      <div class={styles.metadata}>
        <div class={styles.metadataContent}>
          <div class={styles.metadataVersionBadgeContainer}>
            <a
              class={styles.metadataVersionBadge({latest: props.latest})}
              href={githubLink()}
              target={'_blank'}
            >
              {tag()}
            </a>
          </div>
          <div class={styles.metadataVersionDate}>{formattedDate()}</div>
        </div>
      </div>
      <div class={styles.content}>
        {props.children}

        <Link
          variant={'underline'}
          link
          href={githubLink()}
          target={'_blank'}
          class={styles.fullChangelogLink}
        >
          Read the full changelog on GitHub.
        </Link>
      </div>
    </div>
  );
}
