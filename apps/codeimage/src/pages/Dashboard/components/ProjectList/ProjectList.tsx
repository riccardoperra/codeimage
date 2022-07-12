import {Box} from '@codeimage/ui';
import {For, Suspense} from 'solid-js';
import {getDashboardState} from '../../DashboardContext';
import {ProjectItem} from '../ProjectItem/ProjectItem';
import {ProjectItemSkeleton} from '../ProjectItemSkeleton/ProjectItemSkeleton';
import * as styles from './ProjectList.css';

export function ProjectList() {
  const {mode, data} = getDashboardState();

  return (
    <Box
      as={'ul'}
      data-displayMode={mode()}
      class={styles.gridList({displayMode: mode()})}
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
        <For each={data()}>{item => <ProjectItem item={item} />}</For>
      </Suspense>
    </Box>
  );
}
