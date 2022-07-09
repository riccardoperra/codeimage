import {
  Box,
  Button,
  SegmentedField,
  SegmentedFieldItem,
  Text,
} from '@codeimage/ui';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import {Link} from 'solid-app-router';
import {createResource, createSignal, For, Show, Suspense} from 'solid-js';
import {Footer} from './components/Footer/Footer';
import {CodeIcon} from './components/Icons/Code';
import {FolderIcon} from './components/Icons/Folder';
import {GridIcon, ListIcon} from './components/Icons/Grid';
import {PlusIcon} from './components/Icons/PlusIcon';
import * as styles from './Dashboard.css';

export type WorkspaceItemType = 'folder' | 'project';

export interface WorkspaceItem {
  id: string;
  type: WorkspaceItemType;
  name: string;
  createDate: string;
  lastUpdateDate: string;
}

function fetchWorkspaceContent(): Promise<WorkspaceItem[]> {
  return fetch(`/workspace`).then(res => res.json());
}

export default function Dashboard() {
  const [data] = createResource(fetchWorkspaceContent, {
    initialValue: [],
  });

  const [mode, setMode] = createSignal<'grid' | 'list'>('grid');
  const tableModeItems: SegmentedFieldItem<'grid' | 'list'>[] = [
    {
      // @ts-expect-error Support custom elements in segmented field
      label: <GridIcon />,
      value: 'grid',
    },
    {
      // @ts-expect-error Support custom elements in segmented field
      label: <ListIcon />,
      value: 'list',
    },
  ];

  return (
    <div class={styles.scaffold}>
      <Box display={'flex'} height={'100%'}>
        <div class={styles.wrapper}>
          <div class={styles.main}>
            <Box display={'flex'} marginBottom={8}>
              <h1 class={styles.title}>Workspace</h1>
              <div style={{flex: 1}} />
              <Box display={'flex'} style={{width: '80px'}} marginRight={3}>
                <SegmentedField
                  size={'sm'}
                  value={mode()}
                  onChange={setMode}
                  items={tableModeItems}
                />
              </Box>
              <Button theme="primary" variant="solid">
                <PlusIcon size={'sm'} />
                <Box as={'span'} marginLeft={2}>
                  New
                </Box>
              </Button>
            </Box>

            <Box
              as={'ul'}
              data-displayMode={mode()}
              class={styles.gridList({displayMode: mode()})}
            >
              <Suspense
                fallback={
                  <>
                    <li class={styles.itemSkeleton}>
                      <SkeletonLine width={'95%'} height={'16px'} />
                      <SkeletonDivider height={'12px'} />
                      <SkeletonLine width={'65%'} height={'16px'} />
                      <SkeletonDivider height={'13px'} />
                    </li>

                    <li class={styles.itemSkeleton}>
                      <SkeletonLine width={'95%'} height={'16px'} />
                      <SkeletonDivider height={'12px'} />
                      <SkeletonLine width={'65%'} height={'16px'} />
                      <SkeletonDivider height={'13px'} />
                    </li>

                    <li class={styles.itemSkeleton}>
                      <SkeletonLine width={'95%'} height={'16px'} />
                      <SkeletonDivider height={'12px'} />
                      <SkeletonLine width={'65%'} height={'16px'} />
                      <SkeletonDivider height={'13px'} />
                    </li>

                    <li class={styles.itemSkeleton}>
                      <SkeletonLine width={'95%'} height={'16px'} />
                      <SkeletonDivider height={'12px'} />
                      <SkeletonLine width={'65%'} height={'16px'} />
                      <SkeletonDivider height={'13px'} />
                    </li>
                  </>
                }
              >
                <For each={data()}>
                  {item => (
                    <li class={styles.item}>
                      <Link href={`/`} class={styles.itemLink} />
                      {/*<Link href={`/${item.id}`} class={styles.itemLink} />*/}
                      <div class={styles.itemTitle}>
                        <Show
                          fallback={<CodeIcon size={'lg'} />}
                          when={item.type === 'folder'}
                        >
                          <FolderIcon size={'lg'} />
                        </Show>
                        <Text size={'lg'}>{item.name}</Text>
                      </div>
                    </li>
                  )}
                </For>
              </Suspense>
            </Box>
          </div>

          <Footer />
        </div>
      </Box>
    </div>
  );
}
