import {EditorUIOptions} from '@codeimage/store/editor/createEditorOptions';
import {EditorState} from '@codeimage/store/editor/model';
import {FrameStateSlice} from '@codeimage/store/frame';
import {TerminalState} from '@codeimage/store/terminal';
import {
  Box,
  Button,
  HStack,
  SegmentedField,
  SegmentedFieldItem,
} from '@codeimage/ui';
import {useNavigate} from 'solid-app-router';
import {Footer} from '../../components/Footer/Footer';
import {CodeImageLogo} from '../../components/Icons/CodeImageLogo';
import {GridIcon, ListIcon} from '../../components/Icons/Grid';
import {PlusIcon} from '../../components/Icons/PlusIcon';
import {sidebarLogo} from '../../components/Scaffold/Sidebar/Sidebar.css';
import {actionBox, wrapper} from '../../components/Toolbar/Toolbar.css';
import {ToolbarSettingsButton} from '../../components/Toolbar/ToolbarSettings';
import {UserBadge} from '../../components/UserBadge/UserBadge';
import {ProjectList} from './components/ProjectList/ProjectList';
import * as styles from './Dashboard.css';
import {DashboardProvider, getDashboardState} from './DashboardContext';

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

export function DashboardContent() {
  const navigate = useNavigate();
  const {mode, setMode, createNewProject} = getDashboardState();

  async function createNew() {
    const result = await createNewProject();
    if (!result) return;
    navigate(`/${result.id}`);
  }

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

            <ProjectList />
          </div>

          <Footer />
        </div>
      </Box>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export function Toolbar() {
  return (
    <div class={wrapper}>
      <ToolbarSettingsButton />

      <Box display={'flex'} alignItems={'center'} flexGrow={1} marginLeft={4}>
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
