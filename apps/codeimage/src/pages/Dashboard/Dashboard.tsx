import {getAuthState} from '@codeimage/store/auth/auth';
import {EditorState} from '@codeimage/store/editor/model';
import {EditorUIOptions} from '@codeimage/store/editor/createEditorOptions';
import {FrameStateSlice} from '@codeimage/store/frame';
import {TerminalState} from '@codeimage/store/terminal';
import {
  Box,
  Button,
  HStack,
  SegmentedField,
  SegmentedFieldItem,
  Text,
} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import {Link} from 'solid-app-router';
import {createResource, createSignal, For, Show, Suspense} from 'solid-js';
import {Footer} from '../../components/Footer/Footer';
import {CodeIcon} from '../../components/Icons/Code';
import {CodeImageLogo} from '../../components/Icons/CodeImageLogo';
import {FolderIcon} from '../../components/Icons/Folder';
import {GridIcon, ListIcon} from '../../components/Icons/Grid';
import {PlusIcon} from '../../components/Icons/PlusIcon';
import {sidebarLogo} from '../../components/Scaffold/Sidebar/Sidebar.css';
import {actionBox, wrapper} from '../../components/Toolbar/Toolbar.css';
import {UserBadge} from '../../components/UserBadge/UserBadge';
import * as styles from './Dashboard.css';

export type WorkspaceItemType = 'folder' | 'project';

type WorkspaceMetadata = {
  id: string;
  created_at: string;
  frame: FrameStateSlice;
  terminal: TerminalState;
  options: EditorUIOptions;
  editors: EditorState[];
};

export interface WorkspaceItem {
  id: string;
  created_at: string;
  name: string;
  snippetId: string;

  snippets: WorkspaceMetadata;

  userId: string;
  type: WorkspaceItemType;
}

function fetchWorkspaceContent(): Promise<WorkspaceItem[]> {
  return supabase
    .from<WorkspaceItem>('workspace_item')
    .select('*, snippets(*)')
    .filter('userId', 'eq', getAuthState().user()?.user?.id)
    .then(res => res.body ?? []) as Promise<WorkspaceItem[]>;
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
          <Box>
            <Toolbar />
          </Box>
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
                      <Link
                        state={item}
                        href={`/${item.id}`}
                        class={styles.itemLink}
                      />
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

export function Toolbar() {
  return (
    <div class={wrapper}>
      <Box display={'flex'} alignItems={'center'} flexGrow={1}>
        <div class={sidebarLogo}>
          <CodeImageLogo width={'140px'} />
        </div>
      </Box>

      <Box class={actionBox} style={{flex: 1}}>
        <HStack spacing={'2'} marginLeft={'auto'}>
          <UserBadge />
        </HStack>
      </Box>
    </div>
  );
}
