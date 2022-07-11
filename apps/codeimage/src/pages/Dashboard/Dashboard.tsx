import {getAuthState} from '@codeimage/store/auth/auth';
import {
  EditorUIOptions,
  getInitialEditorUiOptions,
} from '@codeimage/store/editor/createEditorOptions';
import {getInitialEditorState} from '@codeimage/store/editor/createEditors';
import {EditorState} from '@codeimage/store/editor/model';
import {FrameStateSlice, getInitialFrameState} from '@codeimage/store/frame';
import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {
  getInitialTerminalState,
  TerminalState,
} from '@codeimage/store/terminal';
import {
  Box,
  Button,
  DropdownItem,
  DropdownMenu,
  DropdownMenuV2,
  FadeInOutTransition,
  HStack,
  MenuButton,
  SegmentedField,
  SegmentedFieldItem,
  Text,
} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import {Item} from '@solid-aria/collection';
import {SkeletonLine} from '@ui/Skeleton/Skeleton';
import {SkeletonDivider} from '@ui/Skeleton/SkeletonDivider';
import {Link, useNavigate} from 'solid-app-router';
import {Popover, PopoverButton} from 'solid-headless';
import {createResource, createSignal, For, Show, Suspense} from 'solid-js';
import {Footer} from '../../components/Footer/Footer';
import {CodeIcon} from '../../components/Icons/Code';
import {CodeImageLogo} from '../../components/Icons/CodeImageLogo';
import {DotVerticalIcon} from '../../components/Icons/DotVertical';
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
  const [data, {mutate}] = createResource(fetchWorkspaceContent, {
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

  const navigate = useNavigate();

  async function createNew() {
    // TODO refactor
    const editor = {...getInitialEditorState(), id: createUniqueId()};

    const result = await supabase
      .from<WorkspaceMetadata>('snippets')
      .insert({
        terminal: getInitialTerminalState(),
        frame: getInitialFrameState(),
        options: getInitialEditorUiOptions(),
        editors: [{...editor, code: window.btoa(editor.code)}],
      })
      .then(res => res.body?.[0]);

    if (result) {
      const workspaceItem = await supabase
        .from<WorkspaceItem>('workspace_item')
        .insert({
          name: 'Untitled',
          snippetId: result.id,
          userId: getAuthState().user()?.user?.id,
        })
        .then(res => res.body?.[0]);

      if (workspaceItem) {
        navigate(`/${result.id}`, {
          state: {
            ...workspaceItem,
            snippets: result,
          },
        });
      }
    }
  }

  async function deleteItem(item: WorkspaceItem) {
    await supabase.from('workspace_item').delete().eq('id', item.id);
    await supabase.from('snippets').delete().eq('id', item.snippetId);
    mutate(items => items.filter(i => i.id !== item.id));
  }

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
              <Button
                theme="primary"
                variant="solid"
                onClick={() => createNew()}
              >
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
                      <div>
                        <div class={styles.itemTitle}>
                          <Show
                            fallback={<CodeIcon size={'lg'} />}
                            when={item.type === 'folder'}
                          >
                            <FolderIcon size={'lg'} />
                          </Show>
                          <Text size={'lg'}>{item.name}</Text>
                        </div>
                      </div>
                      <DropdownMenuV2
                        selectionType={'none'}
                        menuButton={
                          <MenuButton
                            as={Button}
                            variant={'link'}
                            theme={'secondary'}
                            size={'xs'}
                          >
                            <DotVerticalIcon size={'sm'} />
                          </MenuButton>
                        }
                        onAction={action => {
                          if (action === 'delete') {
                            deleteItem(item);
                          }
                        }}
                      >
                        <Item key={'delete'}>Delete</Item>
                      </DropdownMenuV2>
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
