import {Box} from '@codeimage/ui';
import {Pagination} from '@ui/legacy-controls';
import {Errored, For, Repeat, Show} from 'solid-js';
import {getDashboardState} from '../../dashboard.state';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import {ProjectEmptyListMessage} from './ProjectEmptyListMessage';
import {ProjectErrorListFallback} from './ProjectErrorListFallback';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const dashboard = getDashboardState();
  const {paginationState} = dashboard;

  return (
    <Errored
      fallback={(_, reset) => (
        <ProjectErrorListFallback
          onReload={() => {
            void dashboard.refetch();
            reset();
          }}
        />
      )}
    >
      <Show
        when={dashboard.data.error === undefined}
        fallback={
          <ProjectErrorListFallback onReload={() => void dashboard.refetch()} />
        }
      >
        <Show
          when={!dashboard.data.loading || dashboard.data.latest.length > 0}
          fallback={
            <ul class={styles.gridList}>
              <Repeat count={5}>{() => <ProjectItemSkeleton />}</Repeat>
            </ul>
          }
        >
          <Show
            when={dashboard.filteredData().length > 0}
            fallback={<ProjectEmptyListMessage />}
          >
            <ul class={styles.gridList}>
              <For each={dashboard.pagedData()}>
                {item => <ProjectItem item={item} />}
              </For>
            </ul>
            <Box display={'flex'} justifyContent={'center'}>
              <Pagination
                page={paginationState.page()}
                onChange={paginationState.setPage}
                pages={paginationState.totalPages()}
              />
            </Box>
          </Show>
        </Show>
      </Show>
    </Errored>
  );
}
