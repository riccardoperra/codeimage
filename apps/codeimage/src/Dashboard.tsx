import {Box, Button, Text} from '@codeimage/ui';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import {Link, useParams} from 'solid-app-router';
import {useRoute} from 'solid-app-router/dist/routing';
import {
  createEffect,
  createResource,
  createSignal,
  For,
  on,
  Show,
  Suspense,
} from 'solid-js';
import {Footer} from './components/Footer/Footer';
import {CodeIcon} from './components/Icons/Code';
import {CodeImageLogo} from './components/Icons/CodeImageLogo';
import {FolderIcon} from './components/Icons/Folder';
import {PlusIcon} from './components/Icons/PlusIcon';
import {EditorForm} from './components/PropertyEditor/EditorForm';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {sidebarLogo} from './components/Scaffold/Sidebar/Sidebar.css';
import {Toolbar} from './components/Toolbar/Toolbar';
import * as styles from './Dashboard.css';

export type WorkspaceItemType = 'folder' | 'project';

export interface WorkspaceItem {
  id: string;
  type: WorkspaceItemType;
  name: string;
  createDate: string;
  lastUpdateDate: string;
}

function fetchFolders(): Promise<WorkspaceItem[]> {
  return fetch('/workspace/folders').then(res => res.json());
}

function fetchFolderContent(id: string): Promise<WorkspaceItem[]> {
  return fetch(`/workspace/folders/${id}`).then(res => res.json());
}

export default function Dashboard() {
  const [folders] = createResource(fetchFolders);
  const [folderId, setFolderId] = createSignal<string>();
  const params = useParams<{folderId: string}>();
  const [data] = createResource(folderId, fetchFolderContent, {
    initialValue: [],
  });

  createEffect(on(() => params.folderId, setFolderId));

  return (
    <div class={styles.scaffold}>
      <Box display={'flex'} height={'100%'}>
        <Sidebar position={'left'}>
          <EditorForm>
            <div class={sidebarLogo}>
              <CodeImageLogo width={'70%'} />
            </div>

            <ul>
              <For each={folders()}>
                {folder => (
                  <li>
                    <Link href={`/dashboard/${folder.id}`}>{folder.name}</Link>
                  </li>
                )}
              </For>
            </ul>
          </EditorForm>
        </Sidebar>

        <div class={styles.wrapper}>
          <div class={styles.main}>
            <Box display={'flex'}>
              <h1 class={styles.title}>
                Workspace /
                <Box as={'span'} marginLeft={2}>
                  {folders()?.find(folder => folder.id === folderId())?.name}
                </Box>
              </h1>
              <div style={{flex: 1}} />
              <Button theme="primary" variant="solid">
                <PlusIcon size={'sm'} />
                <Box as={'span'} marginLeft={2}>
                  New
                </Box>
              </Button>
            </Box>

            <ul class={styles.gridList}>
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
            </ul>
          </div>

          <Footer />
        </div>
      </Box>
    </div>
  );
}
