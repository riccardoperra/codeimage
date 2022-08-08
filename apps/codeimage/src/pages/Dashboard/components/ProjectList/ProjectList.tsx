import {For, Suspense} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const dashboard = getDashboardState()!;

  return (
    <ul class={styles.gridList}>
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
        <For each={dashboard.filteredData()}>
          {item => <ProjectItem item={item} />}
        </For>
      </Suspense>
    </ul>
  );
}
