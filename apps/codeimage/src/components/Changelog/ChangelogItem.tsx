import {FlowProps} from 'solid-js';
import * as styles from './ChangelogItem.css';

interface ChangelogItemProps {
  version: string;
  date: Date;
}

export function ChangelogItem(props: FlowProps<ChangelogItemProps>) {
  const formattedDate = () =>
    new Intl.DateTimeFormat('en-US', {dateStyle: 'medium'}).format(props.date);

  return (
    <div class={styles.item}>
      <div class={styles.metadata}>
        <div class={styles.metadataContent}>
          <div class={styles.metadataVersionBadgeContainer}>
            <div class={styles.metadataVersionBadge}>v{props.version}</div>
          </div>
          <div class={styles.metadataVersionDate}>{formattedDate()}</div>
        </div>
      </div>
      <div class={styles.content}>{props.children}</div>
    </div>
  );
}
