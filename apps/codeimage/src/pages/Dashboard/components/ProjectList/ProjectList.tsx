import {VirtualizeContext, VirtualizeList} from '@core/modules/virtual';
import {
  ErrorBoundary,
  Index,
  Show,
  Suspense,
  untrack,
  VoidProps,
} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import {ProjectEmptyListMessage} from './ProjectEmptyListMessage';
import {ProjectErrorListFallback} from './ProjectErrorListFallback';
import * as styles from './ProjectList.css';

interface ProjectListProps {
  scrollElement: HTMLElement;
}

export function ProjectList(props: VoidProps<ProjectListProps>) {
  const dashboard = getDashboardState()!;

  const listIsEmpty = () => {
    return !dashboard.data.error && dashboard.filteredData().length === 0;
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

  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <ProjectErrorListFallback onReload={() => reloadList(err, reset)} />
      )}
    >
      <Show when={!listIsEmpty()} fallback={() => <ProjectEmptyListMessage />}>
        <Suspense fallback={<ProjectSkeletons />}>
          <VirtualizeContext
            scrollElement={props.scrollElement}
            rootMargin={`-128px 0px ${128}px 0px`}
            height={128}
            threshold={0}
            gridCount={3}
            itemCount={dashboard.filteredData().length}
          >
            <ul class={styles.gridList}>
              <VirtualizeList itemFallback={<ProjectItemSkeleton />}>
                {index => (
                  <ProjectItem item={dashboard.filteredData()[index]} />
                )}
              </VirtualizeList>
            </ul>
          </VirtualizeContext>
        </Suspense>
      </Show>
    </ErrorBoundary>
  );
}
