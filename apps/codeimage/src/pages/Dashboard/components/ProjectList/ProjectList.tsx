import {ErrorBoundary, For, Show, Suspense} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import {ProjectEmptyListMessage} from './ProjectEmptyListMessage';
import {ProjectErrorListFallback} from './ProjectErrorListFallback';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const dashboard = getDashboardState()!;

  const listIsEmpty = () => {
    return !dashboard.data.error && dashboard.filteredData().length === 0;
  };

  const reloadList = (err: unknown, reset: () => void) => {
    reset();
    dashboard.refetch();
  };

  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <ProjectErrorListFallback onReload={() => reloadList(err, reset)} />
      )}
    >
      <Show when={!listIsEmpty()} fallback={() => <ProjectEmptyListMessage />}>
        <ul class={styles.gridList}>
          <Suspense
            fallback={
              <>
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
      </Show>
    </ErrorBoundary>
  );
}
