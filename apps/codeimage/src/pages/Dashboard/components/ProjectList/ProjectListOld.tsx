import {groupArrayByN} from '@core/helpers/array';
import {Key, Rerun} from '@solid-primitives/keyed';
import {Repeat} from '@solid-primitives/range';
import {createVirtualizer} from '@tanstack/solid-virtual';
import {
  createEffect,
  For,
  Index,
  on,
  Show,
  startTransition,
  Suspense,
  untrack,
  VoidProps,
} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import {ProjectEmptyListMessage} from './ProjectEmptyListMessage';
import * as styles from './ProjectList.css';

interface ProjectListProps {
  scrollElement: HTMLElement;
}

const createVirtual = () => {};

export function ProjectList(props: VoidProps<ProjectListProps>) {
  const dashboard = getDashboardState()!;

  const groupedData = () => {
    return dashboard.filteredData();
  };

  const listIsEmpty = () => {
    return !dashboard.data.error && dashboard.filteredData().length === 0;
  };

  const reloadList = (err: unknown, reset: () => void) => {
    dashboard.refetch();
    reset();
  };

  const ProjectSkeletons = () => {
    const count = untrack(dashboard.filteredData).length;
    const list = Array.from({length: count || 5});
    return <Index each={list}>{() => <ProjectItemSkeleton />}</Index>;
  };

  const rowVirtualizer = createVirtualizer({
    count: untrack(dashboard.data).length,
    estimateSize: () => 128,
    getScrollElement: () => props.scrollElement,
    overscan: 5,
    onChange(instance) {
      console.log(instance.getVirtualItems(), 'VIRTUAL ITEMS');
    },
  });

  createEffect(
    on(
      () => groupedData().length,
      data => {
        rowVirtualizer.setOptions({
          ...rowVirtualizer.options,
          count: data,
        });
        startTransition(() => rowVirtualizer.measure());
      },
    ),
  );

  return (
    // <ErrorBoundary
    //   fallback={(err, reset) => (
    //     <ProjectErrorListFallback onReload={() => reloadList(err, reset)} />
    //   )}
    // >
    <Suspense
      fallback={
        <ul class={styles.gridList}>
          <ProjectSkeletons />
        </ul>
      }
    >
      <Show when={!listIsEmpty()} fallback={() => <ProjectEmptyListMessage />}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          <For each={rowVirtualizer.getVirtualItems()}>
            {(virtualRow, index) => {
              index();
              const data = groupedData()?.[virtualRow.index];
              return (
                <div
                  class={styles.gridListItemWrapper}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    'z-index': 0,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  <Show when={data}>
                    {data => {
                      return (
                        <ul class={styles.gridList}>
                          <Repeat times={data.length}>
                            {n => {
                              const item = data.at(n);
                              return (
                                <Show when={!!item}>
                                  <div data-k={virtualRow.key}>
                                    <ProjectItem item={item!} />
                                  </div>
                                </Show>
                              );
                            }}
                          </Repeat>
                        </ul>
                      );
                    }}
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </Suspense>
    // </ErrorBoundary>
  );
}
