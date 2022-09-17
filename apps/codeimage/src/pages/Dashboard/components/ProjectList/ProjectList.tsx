import {getLastPage, Pagination} from '@codeimage/ui';
import {ErrorBoundary, For, Index, Show, Suspense, untrack} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import {ProjectEmptyListMessage} from './ProjectEmptyListMessage';
import {ProjectErrorListFallback} from './ProjectErrorListFallback';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const dashboard = getDashboardState()!;

  const listIsEmpty = () => {
    return !dashboard.data.error && dashboard.filteredData()?.length === 0;
  };

  const reloadList = (err: unknown, reset: () => void) => {
    dashboard.refetch();
    reset();
  };

  const ProjectSkeletons = () => {
    const count = untrack(dashboard.data).length;
    const list = Array.from({length: count || 5});
    return <Index each={list}>{() => <ProjectItemSkeleton />}</Index>;
  };
  const lastPage = () =>
    getLastPage(dashboard.filteredData, dashboard.pageSize);
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <ProjectErrorListFallback onReload={() => reloadList(err, reset)} />
      )}
    >
      <Suspense
        fallback={
          <ul class={styles.gridList}>
            <ProjectSkeletons />
          </ul>
        }
      >
        <Show
          when={!listIsEmpty()}
          fallback={() => <ProjectEmptyListMessage />}
        >
          <ul class={styles.gridList}>
            <For each={dashboard.pagedData()}>
              {item => <ProjectItem item={item} />}
            </For>
          </ul>
          <Show when={lastPage() !== 1}>
            <Pagination
              pageNumber={dashboard.page()}
              onChange={dashboard.setPage}
              lastPage={lastPage()}
            />
          </Show>
        </Show>
      </Suspense>
    </ErrorBoundary>
  );
}
