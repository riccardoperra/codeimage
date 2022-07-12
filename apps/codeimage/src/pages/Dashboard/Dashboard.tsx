import {EditorUIOptions} from '@codeimage/store/editor/createEditorOptions';
import {EditorState} from '@codeimage/store/editor/model';
import {FrameStateSlice} from '@codeimage/store/frame';
import {TerminalState} from '@codeimage/store/terminal';
import {Box} from '@codeimage/ui';
import {Footer} from '../../components/Footer/Footer';
import {DashboardHeader} from './components/DashboardHeader/DashboardHeader';
import {ProjectList} from './components/ProjectList/ProjectList';
import {ProjectToolbar} from './components/ProjectToolbar/ProjectToolbar';
import * as styles from './Dashboard.css';
import {DashboardProvider} from './DashboardContext';

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
  return (
    <div class={styles.scaffold}>
      <Box display={'flex'} height={'100%'}>
        <div class={styles.wrapper}>
          <DashboardHeader />

          <div class={styles.main}>
            <ProjectToolbar />

            <Box class={styles.scrollableList}>
              <ProjectList />
            </Box>
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
