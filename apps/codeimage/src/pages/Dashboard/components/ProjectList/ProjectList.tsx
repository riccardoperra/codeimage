import {Box} from '@codeimage/ui';
import {For, Suspense} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const dashboard = getDashboardState()!;

  return (
    <Box
      as={'ul'}
      data-displayMode={dashboard.mode()}
      class={styles.gridList({displayMode: dashboard.mode()})}
    >
      <Suspense
        fallback={
          <>
            <ProjectItemSkeleton />
            <ProjectItemSkeleton />
            <ProjectItemSkeleton />
            <ProjectItemSkeleton />
          </>
        }
      >
        <For each={dashboard.data()}>{item => <ProjectItem item={item} />}</For>
      </Suspense>
    </Box>
  );
}
