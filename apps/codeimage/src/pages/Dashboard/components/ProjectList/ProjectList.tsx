import {FadeInOutTransition} from '@codeimage/ui';
import {VirtualizeContext, VirtualizeItem} from '@core/modules/virtual';
import {Motion, Presence} from '@motionone/solid';
import {Transition} from 'solid-headless';
import {
  ErrorBoundary,
  For,
  Index,
  Show,
  Suspense,
  SuspenseList,
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
        <ul class={styles.gridList}>
          <Suspense fallback={<ProjectSkeletons />}>
            <VirtualizeContext
              scrollElement={props.scrollElement}
              rootMargin={`-128px 0px ${128}px 0px`}
              threshold={0}
            >
              <For each={dashboard.filteredData()}>
                {item => (
                  <VirtualizeItem
                    height={128}
                    fallback={<ProjectItemSkeleton />}
                  >
                    <ProjectItem item={item} />
                  </VirtualizeItem>
                )}
              </For>
            </VirtualizeContext>
          </Suspense>
        </ul>
      </Show>
    </ErrorBoundary>
  );
}
